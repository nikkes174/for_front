from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base


# Temporary reference tables for MVP startup.
# These tables exist only to satisfy legacy ForeignKey declarations inside
# client_circout while real source entities live in other services/modules.


class OrganizationRefModel(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class BranchRefModel(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class RoleRefModel(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class EmployeeRefModel(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class ServiceRefModel(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class ProductRefModel(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class SaleRefModel(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class FileRefModel(Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class CertificateRefModel(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class SubscriptionRefModel(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class ClientVisitRefModel(Base):
    __tablename__ = "client_visits"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)


class ClientProcedureRefModel(Base):
    __tablename__ = "client_procedures"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=False)
