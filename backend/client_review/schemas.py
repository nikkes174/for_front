from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReviewTargetType(StrEnum):
    BRANCH = "branch"
    EMPLOYEE = "employee"


class ClientReviewCreateSchema(BaseModel):
    organization_id: int = Field(gt=0)
    client_id: int = Field(gt=0)
    text: str = Field(min_length=1, max_length=5000)
    rating: int = Field(ge=1, le=5)
    branch_id: int | None = Field(default=None, gt=0)
    employee_id: int | None = Field(default=None, gt=0)
    visit_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_single_target(self) -> "ClientReviewCreateSchema":
        if (self.branch_id is None) == (self.employee_id is None):
            raise ValueError("exactly one of branch_id or employee_id must be provided")
        self.text = self.text.strip()
        if not self.text:
            raise ValueError("review text must not be blank")
        return self


class ClientReviewUpdateSchema(BaseModel):
    text: str | None = Field(default=None, min_length=1, max_length=5000)
    rating: int | None = Field(default=None, ge=1, le=5)

    @model_validator(mode="after")
    def validate_update(self) -> "ClientReviewUpdateSchema":
        if self.text is None and self.rating is None:
            raise ValueError("at least one field must be provided")
        if self.text is not None:
            self.text = self.text.strip()
            if not self.text:
                raise ValueError("review text must not be blank")
        return self


class ClientReviewReadSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    client_id: int
    client_name: str
    text: str
    rating: int
    target_type: ReviewTargetType
    branch_id: int | None
    employee_id: int | None
    created_at: datetime
    updated_at: datetime | None


class TargetRatingSchema(BaseModel):
    organization_id: int
    target_type: ReviewTargetType
    target_id: int
    rating: float | None
    reviews_count: int
