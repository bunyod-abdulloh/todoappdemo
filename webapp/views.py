from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Task
from .serializers import TaskSerializer

@csrf_exempt
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    # Faqat o‘sha user’ning tasklari
    tasks = Task.objects.filter(user=request.user).order_by('-id')
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_task(request):
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        # task user bilan bog‘lanadi
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_task(request, pk):
    try:
        # Faqat o‘z task’ini topa oladi
        task = Task.objects.get(id=pk, user=request.user)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = TaskSerializer(task, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_task(request, pk):
    try:
        # Faqat o‘z task’ini o‘chira oladi
        task = Task.objects.get(id=pk, user=request.user)
    except Task.DoesNotExist:
        return Response(
            {"error": "Task not found or you don't have permission"},
            status=status.HTTP_404_NOT_FOUND
        )

    task.delete()
    return Response({"message": "Task deleted"}, status=status.HTTP_204_NO_CONTENT)
