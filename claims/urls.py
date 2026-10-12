from django.urls import path
from django.views.generic import TemplateView

from .views import ( CreateClaimView, 
                    MatchDetailsView, 
                    AdminPendingClaimsView, 
                    AdminClaimVerificationView,
                    ApproveClaimView,
                    RejectClaimView,
)

urlpatterns = [
    path(
        "",
        CreateClaimView.as_view(),
        name="create-claim"
    ),

    path(
        "page/",
        TemplateView.as_view(
            template_name="claim.html"
        ),
        name="claim-page"
    ),

    path(
        "match/<int:match_id>/",
        MatchDetailsView.as_view(),
        name="match-details"
    ),
    path(
        "admin/pending/",
        AdminPendingClaimsView.as_view(),
        name="admin-pending-claims"
    ),
    path(
        "admin/<int:claim_id>/",
        AdminClaimVerificationView.as_view(),
        name="admin-claim-verification"
    ),
    path(
        "admin/page/<int:claim_id>/",
        TemplateView.as_view(
            template_name="admin_claim_verification.html"
        ),
        name="admin-claim-verification-page"
    ),
    path(
        "admin/<int:claim_id>/approve/",
        ApproveClaimView.as_view(),
        name="admin-approve-claim",
    ),
    path(
        "admin/<int:claim_id>/reject/",
        RejectClaimView.as_view(),
        name="admin-reject-claim",
    ),
]