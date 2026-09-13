"""
标准化的 API 响应模型。

在所有端点间提供一致的响应格式。
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    标准 API 响应包装器。

    用法：
        # 成功响应
        return APIResponse(code=200, message="success", data={"user_id": 123})

        # 错误响应
        return APIResponse(code=404, message="Not found", data=None)
    """

    code: int = 200
    message: str = "success"
    data: Optional[T] = None
    request_id: Optional[str] = Field(default=None, exclude=True)
    metadata: dict[str, Any] = Field(default_factory=dict, exclude=True)
    error_code: Optional[str] = Field(default=None, exclude=True)

    @property
    def success(self) -> bool:
        """Compatibility property; the JSON contract uses code/message/data."""
        return 200 <= self.code < 400

    @property
    def error(self) -> Optional[str]:
        """Compatibility property for callers that inspect failed responses."""
        return None if self.success else self.message


class PaginationMeta(BaseModel):
    """分页元数据。"""

    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 0
    has_next: bool = False
    has_prev: bool = False


class PaginatedResponse(APIResponse[dict[str, Any]], Generic[T]):
    """
    分页 API 响应。

    用法：
        return PaginatedResponse(data={"items": items, "total": 100, "page": 1, "page_size": 20})
    """

    @property
    def pagination(self) -> Optional[PaginationMeta]:
        """Build compatibility metadata from the canonical data object."""
        if not self.data:
            return None
        return PaginationMeta(
            page=int(self.data.get("page", 1)),
            page_size=int(self.data.get("page_size", 20)),
            total_items=int(self.data.get("total", 0)),
            total_pages=int(self.data.get("total_pages", 0)),
            has_next=bool(self.data.get("has_next", False)),
            has_prev=bool(self.data.get("has_prev", False)),
        )


def success_response(
    data: Any = None,
    message: str = "success",
    request_id: Optional[str] = None,
    **metadata,
) -> APIResponse:
    """
    创建成功响应。

    用法：
        return success_response({"user": user_data})
        return success_response(user, message="User created")
    """
    return APIResponse(
        code=200,
        data=data,
        message=message,
        request_id=request_id,
        metadata=metadata,
    )


def error_response(
    error: str,
    error_code: Optional[str] = None,
    status_code: int = 400,
    request_id: Optional[str] = None,
    **metadata,
) -> tuple[APIResponse, int]:
    """
    创建带状态码的错误响应。

    用法：
        return error_response("User not found", "USER_NOT_FOUND", 404)
    """
    response = APIResponse(
        code=status_code,
        message=error,
        data=None,
        error_code=error_code,
        request_id=request_id,
        metadata=metadata,
    )
    return response, status_code


def paginated_response(
    data: list[Any],
    page: int = 1,
    page_size: int = 20,
    total_items: int = 0,
    request_id: Optional[str] = None,
) -> PaginatedResponse:
    """
    创建分页响应。

    用法：
        items = get_items(page=1, limit=20)
        total = count_items()
        return paginated_response(items, page=1, page_size=20, total_items=total)
    """
    total_pages = (total_items + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse(
        code=200,
        message="success",
        data={
            "items": data,
            "total": total_items,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        request_id=request_id,
    )
