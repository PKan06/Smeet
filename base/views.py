from django.shortcuts import render
from django.http import JsonResponse
from agora_token_builder import RtcTokenBuilder
import time, random, json
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

def getToken(request):
    appId = '66dd337d514f44bc906832db226f6b53'
    appCertificate = "63b37f231b434c2aa34935aaac342292"
    channelName = request.GET.get('channel')
    uid = random.randint(1,230) # generating the random ids for joiners 
    expirationTimeInSeconds = 3600 * 24
    currentTimeStamp = time.time()
    privilegeExpiredTs = currentTimeStamp + expirationTimeInSeconds
    role =1 # if1->Host , 2->Guest 
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, "uid":uid},safe=False)

def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

@csrf_exempt
def createMember(request):
    data = json.loads(request.body)

    # if new user is created the create -> true
    # if user exits then create -> false
    member, created = RoomMember.objects.get_or_create(
        # this will check all the 3 parameters 
        # if exist then only create->false & fetch 
        # otherwise it will create them 
        name = data['name'],
        uid=data['UID'],
        room_name = data['room_name']
    )

    return JsonResponse({'name': data['name']}, safe=False) # safe = true => only disctionary can pass


def getMember(request):
    uid = request.GET.get('uid')
    room_name = request.GET.get('room_name')

    # get the data after for remote users 
    # after verifing there uid & room_name 
    member = RoomMember.objects.get(uid = uid, room_name = room_name)

    return JsonResponse({'name': member.name}, safe=False)

@csrf_exempt
def deleteMember(request):
    data = json.loads(request.body)

    # if new user is created the create -> true
    # if user exits then create -> false
    member= RoomMember.objects.get(
        # this will check all the 3 parameters 
        # if exist then only create->false & fetch 
        # otherwise it will create them 
        name = data['name'],
        uid=data['UID'],
        room_name = data['room_name']
    )
    member.delete()

    return JsonResponse({ data['name']  + ' Member deleted'  }, safe=False) # safe = true => only disctionary can pass