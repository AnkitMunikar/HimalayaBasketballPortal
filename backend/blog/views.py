# backend/blog/views.py
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Post
from .serializers import PostListSerializer, PostDetailSerializer


class PostListView(generics.ListAPIView):
    """Public list of published posts (blog/news)."""
    queryset = Post.objects.filter(is_published=True).select_related('author').order_by('-created_at')
    serializer_class = PostListSerializer
    permission_classes = [AllowAny]


class PostDetailView(generics.RetrieveAPIView):
    """Public single post by slug."""
    serializer_class = PostDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    lookup_url_kwarg = 'slug'

    def get_queryset(self):
        return Post.objects.filter(is_published=True).select_related('author')
