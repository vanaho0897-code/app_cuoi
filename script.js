const weddingDate = new Date("2026-12-19T09:00:00+07:00").getTime();
const countdownParts = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};
const countdownNote = document.querySelector("#countdown-note");

function updateCountdown() {
  const remaining = weddingDate - Date.now();

  if (remaining <= 0) {
    Object.values(countdownParts).forEach((part) => {
      part.textContent = "00";
    });
    countdownNote.textContent = "Ngày vui của chúng mình đã đến!";
    return;
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  countdownParts.days.textContent = String(days).padStart(2, "0");
  countdownParts.hours.textContent = String(hours).padStart(2, "0");
  countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
  countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const toast = document.querySelector("#toast");
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3200);
}

function escapeCalendarText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

document.querySelector("#calendar-button").addEventListener("click", () => {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = [
    ["vu-quy", "Lễ Vu Quy — Đoàn Thị Bích Ngọc & Hồ Văn Á", "20261219T020000Z", "Tư gia nhà gái"],
    ["thanh-hon", "Lễ Thành Hôn — Đoàn Thị Bích Ngọc & Hồ Văn Á", "20261220T020000Z", "Tư gia nhà trai"],
  ];
  const eventLines = events.flatMap(([id, title, start, location]) => [
    "BEGIN:VEVENT",
    `UID:${id}-ngoc-va-${start}@wedding-invitation`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DURATION:PT2H`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "DESCRIPTION:Lễ bắt đầu lúc 09:00 giờ Việt Nam. Địa chỉ cụ thể sẽ được gia đình cập nhật.",
    "END:VEVENT",
  ]);
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bich Ngoc and Van A//Wedding Invitation//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventLines,
    "END:VCALENDAR",
  ].join("\r\n");
  const file = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ngoc-va-a-19-20-12-2026.ics";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Đã tải lịch gồm hai buổi lễ. Mở tệp .ics để lưu vào lịch của bạn.");
});

const galleryButtons = [...document.querySelectorAll(".gallery-item")];
const galleryDialog = document.querySelector("#gallery-dialog");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCaption = document.querySelector("#lightbox-caption");
let activeImageIndex = 0;

function showGalleryImage(index) {
  activeImageIndex = (index + galleryButtons.length) % galleryButtons.length;
  const button = galleryButtons[activeImageIndex];
  const image = button.dataset.image;
  lightboxImage.src = image;
  lightboxImage.alt = button.querySelector("img").alt;
  lightboxCaption.textContent = button.dataset.caption;
}

galleryButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    showGalleryImage(index);
    galleryDialog.showModal();
  });
});

document.querySelector("#lightbox-close").addEventListener("click", () => galleryDialog.close());
document.querySelector("#lightbox-prev").addEventListener("click", () => showGalleryImage(activeImageIndex - 1));
document.querySelector("#lightbox-next").addEventListener("click", () => showGalleryImage(activeImageIndex + 1));
galleryDialog.addEventListener("click", (event) => {
  if (event.target === galleryDialog) galleryDialog.close();
});
galleryDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") showGalleryImage(activeImageIndex - 1);
  if (event.key === "ArrowRight") showGalleryImage(activeImageIndex + 1);
});

document.querySelector("#rsvp-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const guestName = String(formData.get("name")).trim();
  const attendance = String(formData.get("attendance"));
  const reply = String(formData.get("reply"));
  const message = `Xin chào Ngọc và Á, mình là ${guestName}. ${reply} ${attendance}. Chúc hai bạn thật nhiều hạnh phúc!`;
  const shareData = { title: "Hồi âm thiệp cưới Ngọc & Á", text: message };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      showToast("Cảm ơn bạn đã gửi lời hồi âm!");
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Không mở được ứng dụng chia sẻ. Bạn có thể thử lại hoặc sao chép lời hồi âm.");
      }
    }
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  showToast("WhatsApp đã mở. Chọn người nhận để gửi lời hồi âm nhé.");
});

document.querySelector("#share-button").addEventListener("click", async () => {
  const shareData = {
    title: "Thiệp cưới Bích Ngọc & Văn Á",
    text: "Trân trọng kính mời bạn đến chung vui cùng Bích Ngọc và Văn Á vào ngày 19–20.12.2026.",
    url: window.location.href,
  };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error.name !== "AbortError") showToast("Không thể chia sẻ thiệp lúc này.");
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Đã sao chép liên kết thiệp mời.");
  } catch {
    showToast("Trình duyệt không hỗ trợ sao chép tự động. Hãy sao chép liên kết trên thanh địa chỉ.");
  }
});
