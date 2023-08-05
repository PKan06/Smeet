const APP_ID = '66dd337d514f44bc906832db226f6b53'
const UID = sessionStorage.getItem('UID')
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')

let NAME = sessionStorage.getItem('name')

// console.log('streams.js connected!!')

// joining the local client 
const client = AgoraRTC.createClient({mode:"rtc",  codec:'vp8'})
//                           optimization output   encoding methord of browser 

// this will stores the prmission of audio and video 
let localAudioTrack = []
let localVideoTrack = []
// this will stores the user present 
let remoteUsers = {}

let joinAndDisplayLocalStream = async() => {
    document.getElementById('room-name').innerText = CHANNEL
    // to check the other user
    client.on('user-published', handleUserJoined)
    // if user left
    client.on('user-left', handleUserLeft)// try to join the meet

    try {
        await client.join(APP_ID, CHANNEL , TOKEN , UID) // null -> because we will use uid which it will genereate 
    } catch (error) {
        console.log(error)
        window.open('/', '_self')
    }
    // storing the audio and video track
    localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack = await AgoraRTC.createCameraVideoTrack();


    let member = await createMember()
    console.log(member)
    let player =    `<div class="video-container" id="user-container-${UID}">
                        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                        <div class="video-player" id="user-${UID}"> </div>
                    </div>`
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
    
    localVideoTrack.play(`user-${UID}`)
    
    // providing the local tracks to other users
    await client.publish([localAudioTrack, localVideoTrack]);
}

let handleUserJoined = async(user, mediaType) => {
    // this function is responsible to add the other connected users
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType)
    // if user is then then we have to add it to the id video-stream to show its video
    
    if(mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if(player != null) {player.remove}
        // getting the name from db
        let member = await getMember(user)
        // new player added 
        player =    `<div class="video-container" id="user-container-${user.uid}">
                        <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                        <div class="video-player" id="user-${user.uid}"> </div>
                    </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){user.audioTrack.play()}
}

let handleUserLeft = async(user) => {
    // this will remove the user if they left the smeet
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async() => {
    for(let i = 0; i < localVideoTrack.length; i++ )
    {
        // closing local audio and video track
        localAudioTrack[i].stop()
        localAudioTrack[i].close()
        localVideoTrack[i].stop()
        localVideoTrack[i].close()
    }

    await client.leave()
    deleteMember()
    window.open('/', '_self')
}

let toggelCamera = async(e) =>{
    if(localVideoTrack.muted)
    {
        await localVideoTrack.setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }
    else
    {
        await localVideoTrack.setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80 ,1 )'
    }
}

let toggelAudio = async(e) =>{
    if(localAudioTrack.muted)
    {
        await localAudioTrack.setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }
    else
    {
        await localAudioTrack.setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80 ,1 )'
    }
} 
// calling the api to create an entry in db
let createMember= async ()=>{
    let response = await fetch('/create_member/',{
        method:'POST',
        headers:{
            'Content-Type' : 'application/json'
        },
        body:JSON.stringify({'name': NAME, 'room_name': CHANNEL , 'UID':UID})
    })

    let member = response.json()
    return member
}

let getMember = async (user) => {
    let response = await fetch(`/get_member/?uid=${user.uid}&room_name=${CHANNEL}`)
    let member =  response.json()
    return member
}

let deleteMember= async ()=>{
    let response = await fetch('/delete_member/',{
        method:'POST',
        headers:{
            'Content-Type' : 'application/json'
        },
        body:JSON.stringify({'name': NAME, 'room_name': CHANNEL , 'UID':UID})
    })

    let member = response.json()
}

joinAndDisplayLocalStream()
window.addEventListener('beforeunload', deleteMember)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('camera-btn').addEventListener('click', toggelCamera)
document.getElementById('mic-btn').addEventListener('click', toggelAudio)