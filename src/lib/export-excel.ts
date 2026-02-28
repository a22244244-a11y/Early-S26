import * as XLSX from "xlsx";

interface Reservation {
  customerName: string;
  recruiter: string;
  storeName: string;
  model: string;
  color: string;
  storage?: string;
  productNumber: string;
  subscriptionType: string;
  activationTiming: string;
  preOrderNumber?: string;
  matchedSerialNumber?: string;
  status: string;
  documentStatus?: string;
  _creationTime: number;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function exportReservationsToExcel(
  reservations: Reservation[],
  fileName: string
) {
  const rows = reservations.map((r) => ({
    고객명: r.customerName,
    유치자: r.recruiter,
    매장: r.storeName,
    모델: r.model,
    색상: r.color,
    용량: r.storage || "512GB",
    개통번호: r.productNumber || "",
    가입유형: r.subscriptionType,
    개통시점: r.activationTiming,
    사전예약번호: r.preOrderNumber || "",
    배정일련번호: r.matchedSerialNumber || "",
    상태: r.status,
    서류상태: r.documentStatus || "미작성",
    등록일시: formatDate(r._creationTime),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 설정
  ws["!cols"] = [
    { wch: 10 }, // 고객명
    { wch: 10 }, // 유치자
    { wch: 12 }, // 매장
    { wch: 14 }, // 모델
    { wch: 14 }, // 색상
    { wch: 8 },  // 용량
    { wch: 14 }, // 개통번호
    { wch: 10 }, // 가입유형
    { wch: 12 }, // 개통시점
    { wch: 16 }, // 사전예약번호
    { wch: 18 }, // 배정일련번호
    { wch: 8 },  // 상태
    { wch: 10 }, // 서류상태
    { wch: 18 }, // 등록일시
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "예약목록");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
