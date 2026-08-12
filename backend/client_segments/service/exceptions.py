from __future__ import annotations


class SegmentServiceError(Exception):
    pass


class SegmentNotFoundError(SegmentServiceError):
    pass


class SegmentMemberNotFoundError(SegmentServiceError):
    pass


class SegmentRuleValidationError(SegmentServiceError):
    pass


class SegmentRuleUnsupportedError(SegmentServiceError):
    pass


class SegmentRecalculationError(SegmentServiceError):
    pass
