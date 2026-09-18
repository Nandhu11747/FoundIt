from .models import Report
from .models import Match



def find_matching_lost_reports(found_report):
    """
    Find Lost Reports that belong to the same category
    as the given Found Report.
    """

    lost_reports = Report.objects.filter(
        type="lost",
        category=found_report.category
    ).exclude(
        user=found_report.user
    )

    return lost_reports

def calculate_match_score(lost_report, found_report):
    """
    Calculate a match score between a Lost Report
    and a Found Report.
    """

    score = 0

    # Item name — 25 points
    if lost_report.item_name.lower() == found_report.item_name.lower():
        score += 25

    # Brand — 15 points
    if (
        lost_report.brand
        and found_report.brand
        and lost_report.brand.lower() == found_report.brand.lower()
    ):
        score += 15

    # Color — 10 points
    if (
        lost_report.color
        and found_report.color
        and lost_report.color.lower() == found_report.color.lower()
    ):
        score += 10

    # Location — 15 points
    if lost_report.location.lower() == found_report.location.lower():
        score += 15

    # Event date — 5 points
    if lost_report.event_date == found_report.event_date:
        score += 5

    # Description — 5 points
    if (
        lost_report.description
        and found_report.description
        and lost_report.description.lower()
        in found_report.description.lower()
    ):
        score += 5

    # Category — 25 points
    if lost_report.category.lower() == found_report.category.lower():
        score += 25

    return score

def create_matches_for_found_report(found_report):
    """
    Find Lost Reports that could match a Found Report
    and create Match records for strong candidates.
    """

    candidates = find_matching_lost_reports(found_report)

    matches_created = []

    for lost_report in candidates:

        score = calculate_match_score(
            lost_report,
            found_report
        )

        if score >= 70:

            match, created = Match.objects.get_or_create(
                lost_report=lost_report,
                found_report=found_report,
                defaults={
                    "match_score": score,
                    "status": "pending",
                }
            )

            if created:
                matches_created.append(match)

    return matches_created

def create_matches_for_lost_report(lost_report):
    """
    Find Found Reports that could match a Lost Report
    and create Match records for strong candidates.
    """

    found_reports = Report.objects.filter(
        type="found",
        category=lost_report.category
    ).exclude(
        user=lost_report.user
    )

    matches_created = []

    for found_report in found_reports:

        score = calculate_match_score(
            lost_report,
            found_report
        )

        if score >= 70:

            match, created = Match.objects.get_or_create(
                lost_report=lost_report,
                found_report=found_report,
                defaults={
                    "match_score": score,
                    "status": "pending",
                }
            )

            if created:
                matches_created.append(match)

    return matches_created