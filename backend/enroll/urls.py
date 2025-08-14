from rest_framework.routers import DefaultRouter
from .views import EnrollViews, PlayerViews

router = DefaultRouter()
router.register(r'player', PlayerViews)
router.register(r'enroll', EnrollViews)

urlpatterns = router.urls
