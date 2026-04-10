"use client";

interface PaginationProps {
  pagination: { page: number; totalPages: number };
  onChangePage: (page: number) => void;
}

export default function Pagination({ pagination, onChangePage }: PaginationProps) {
  const { page, totalPages } = pagination;

  const handleClick = (e: React.MouseEvent, p: number) => {
    e.preventDefault();
    if (p < 1 || p > totalPages) return;
    onChangePage(p);
  };

  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Page navigation">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <a className="page-link" href="#" onClick={(e) => handleClick(e, page - 1)}>
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
        {Array.from({ length: totalPages }, (_, i) => (
          <li className={`page-item ${page === i + 1 ? "active" : ""}`} key={i}>
            <a className="page-link" href="#" onClick={(e) => handleClick(e, i + 1)}>
              {i + 1}
            </a>
          </li>
        ))}
        <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
          <a className="page-link" href="#" onClick={(e) => handleClick(e, page + 1)}>
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
