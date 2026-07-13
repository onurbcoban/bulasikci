// --- UYGULAMA DURUMU (STATE) ---
let userA = "Betül"; // 1. Ev Arkadaşı
let userB = "Onur";  // 2. Ev Arkadaşı
let refDateStr = "2026-07-13"; // Referans Tarihi (Bugün)
let refDate = new Date(refDateStr);
refDate.setHours(0, 0, 0, 0);

// Tamamlanan vardiyaların başlangıç tarihlerini tutan dizi (LocalStorage entegreli)
let completedShifts = JSON.parse(localStorage.getItem("completedShifts")) || [];

// Haftanın Türkçe İsimleri
const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

// --- 1. YARDIMCI TARİH FONKSİYONLARI ---

// Belirli bir tarihin 14 günlük döngüdeki indeksini bulur
function getCycleIndex(targetDate) {
    const tDate = new Date(targetDate);
    tDate.setHours(0, 0, 0, 0);
    const diffTime = tDate - refDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return ((diffDays % 14) + 14) % 14;
}

// Belirli bir tarihte nöbetçinin kim olduğunu bulur
function getAssigneeForDate(targetDate) {
    const cycleIndex = getCycleIndex(targetDate);
    // Yeni Döngü Eşleştirmesi (1 gün geri kaydırılmış):
    // 0 -> Onur (Mon)
    // 3, 4, 5 -> Onur (Thu, Fri, Sat)
    // 8, 9 -> Onur (Tue, Wed)
    // 13 -> Onur (Sun)
    // Geri kalan günler Betül'ündür.
    if ([0, 3, 4, 5, 8, 9, 13].includes(cycleIndex)) {
        return userA;
    } else {
        return userB;
    }
}

// Tarihi YYYY-MM-DD formatında stringe çevirir (LocalStorage anahtarı olarak kullanmak için)
function formatDateString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Belirli bir tarihin ait olduğu vardiyanın BAŞLANGIÇ tarihini bulur
function getShiftStartDate(targetDate) {
    const tDate = new Date(targetDate);
    tDate.setHours(0, 0, 0, 0);
    const cycleIndex = getCycleIndex(tDate);

    let offset = 0;
    // 1 gün geri kaydırılmış vardiya başlangıç günlerine göre offset hesaplama
    if ([0, 2, 4, 7, 9, 11].includes(cycleIndex)) {
        offset = -1; // 2 veya 3 günlük vardiyaların 2. günündeyiz, 1 gün geri git
    } else if ([5, 12].includes(cycleIndex)) {
        offset = -2; // 3 günlük vardiyanın 3. günündeyiz (Cumartesi), 2 gün geri git (Perşembe)
    }

    const startDate = new Date(tDate);
    startDate.setDate(startDate.getDate() + offset);
    return formatDateString(startDate);
}


// Parametre olarak gelen tarihin ait olduğu haftanın 9 gününü üretir (Geçmiş Pazar + 7 Gün + Sonraki Pzt)
function getWeeklyDates(baseDate) {
    const tempDate = new Date(baseDate);
    const dayOfWeek = tempDate.getDay();

    let mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const currentMonday = new Date(tempDate);
    currentMonday.setDate(currentMonday.getDate() + mondayOffset);

    const dates = [];
    for (let i = -1; i <= 7; i++) {
        const calculateDate = new Date(currentMonday);
        calculateDate.setDate(calculateDate.getDate() + i);
        dates.push(calculateDate);
    }
    return dates;
}

// --- 2. UYGULAMA ARAYÜZÜNÜ GÜNCELLEME (RENDER) ---

function renderApp() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Yeni Takvim Yaprağı Verilerini Doldur
    document.getElementById("leaf-day-name").innerText = dayNames[today.getDay()];
    document.getElementById("leaf-day-num").innerText = today.getDate();
    document.getElementById("leaf-month").innerText = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const todayAssignee = getAssigneeForDate(today);
    const leafAssignee = document.getElementById("leaf-assignee");
    leafAssignee.innerText = todayAssignee;

    // Bugünün nöbetçi rengine göre sınıfını ayarla (mavi veya yeşil)
    leafAssignee.className = "leaf-assignee " + (todayAssignee === userA ? "user-a" : "user-b");

    // Takvim kartlarını doldur
    const calendarGrid = document.getElementById("calendar-grid");
    calendarGrid.innerHTML = "";

    const weekDates = getWeeklyDates(today);

    weekDates.forEach((date, index) => {
        const card = document.createElement("div");
        card.className = "day-card";

        // Önceki Pazar veya Gelecek Pazartesi kontrolü (Yarı Opak)
        if (index === 0 || index === 8) {
            card.classList.add("preview");
        }

        // Bugün kontrolü
        if (date.getTime() === today.getTime()) {
            card.classList.add("today");
        }

        // Vardiya tamamlanma kontrolü
        const shiftKey = getShiftStartDate(date);
        if (completedShifts.includes(shiftKey)) {
            card.classList.add("completed");
        }

        // Gün Başlığı (Örn: Geçmiş Pazar / Pazartesi)
        let labelText = "";
        if (index === 0) {
            labelText = "Geçmiş Pazar";
        } else if (index === 8) {
            labelText = "Gelecek Pzt";
        } else {
            labelText = dayNames[date.getDay()];
        }

        const dayLabel = document.createElement("span");
        dayLabel.className = "day-label";
        dayLabel.innerText = labelText;

        // Gün Numarası
        const dayNumber = document.createElement("span");
        dayNumber.className = "day-number";
        dayNumber.innerText = date.getDate();

        // Nöbetçi İsmi
        const assignee = getAssigneeForDate(date);
        const dayAssignee = document.createElement("span");
        dayAssignee.className = `day-assignee ${assignee === userA ? 'user-a' : 'user-b'}`;
        dayAssignee.innerText = assignee;

        // Kartı birleştir ve ekrana ekle
        card.appendChild(dayLabel);
        card.appendChild(dayNumber);
        card.appendChild(dayAssignee);
        calendarGrid.appendChild(card);
    });

    // "Vardiyamı Tamamladım" butonunun bugünkü durumunu ayarla
    const todayShiftKey = getShiftStartDate(today);
    const doneBtn = document.getElementById("done-btn");

    if (completedShifts.includes(todayShiftKey)) {
        doneBtn.classList.add("completed");
        doneBtn.querySelector(".btn-text").innerText = "Vardiya Tamamlandı";
    } else {
        doneBtn.classList.remove("completed");
        doneBtn.querySelector(".btn-text").innerText = "Vardiyamı tamamladım!";
    }

    // Tabak Yığınlarını Güncelle
    renderPlates(today);
}

// 4 Haftalık Periyotta (6 Vardiya) Tamamlanan Nöbet Sayısına Göre Tabakları Aydınlatır
function renderPlates(today) {
    // Bugünün referans tarihe göre gün farkını bulalım
    const diffTime = today - refDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 28 günlük (4 haftalık) bloğun başlangıç gün farkını buluyoruz
    const blockStartDiff = Math.floor(diffDays / 28) * 28;

    // 4 haftalık bloğun başlangıç tarihini oluşturuyoruz
    const blockStartDate = new Date(refDate);
    blockStartDate.setDate(blockStartDate.getDate() + blockStartDiff);

    // 4 haftalık blok içindeki 12 vardiyanın başlangıç günlerini listeliyoruz
    // 14 günlük 1. döngüdeki başlangıç günleri: 0 (Mon), 2 (Wed), 4 (Fri)
    // 14 günlük 2. döngüdeki başlangıç günleri: 7 (Mon), 9 (Wed), 11 (Fri)
    // Bunu 28 güne genişlettiğimizde:
    // 28 günlük periyottaki 1 gün kaydırılmış vardiya başlangıç günleri:
    const userAShiftOffsets = [-1, 3, 8, 13, 17, 22]; // Onur'un vardiya başlangıçları (Pazar, Perşembe, Salı...)
    const userBShiftOffsets = [1, 6, 10, 15, 20, 24];  // Betül'ün vardiya başlangıçları

    let completedCountA = 0;
    let completedCountB = 0;

    // User A için tamamlananları say
    userAShiftOffsets.forEach(offset => {
        const shiftDate = new Date(blockStartDate);
        shiftDate.setDate(shiftDate.getDate() + offset);
        const key = formatDateString(shiftDate);
        if (completedShifts.includes(key)) {
            completedCountA++;
        }
    });

    // User B için tamamlananları say
    userBShiftOffsets.forEach(offset => {
        const shiftDate = new Date(blockStartDate);
        shiftDate.setDate(shiftDate.getDate() + offset);
        const key = formatDateString(shiftDate);
        if (completedShifts.includes(key)) {
            completedCountB++;
        }
    });

    // Arayüzdeki tabakları güncelle (alttan yukarı doğru)
    const platesA = document.querySelectorAll("#stack-user-a .plate-line");
    const platesB = document.querySelectorAll("#stack-user-b .plate-line");

    // Arayüzde isimleri güncelle
    document.getElementById("stack-name-a").innerText = userA;
    document.getElementById("stack-name-b").innerText = userB;

    // Tabakları aydınlat
    platesA.forEach((plate, index) => {
        if (index < completedCountA) {
            plate.classList.add("active");
        } else {
            plate.classList.remove("active");
        }
    });

    platesB.forEach((plate, index) => {
        if (index < completedCountB) {
            plate.classList.add("active");
        } else {
            plate.classList.remove("active");
        }
    });
}

// --- 3. KULLANICI ETKİLEŞİMLERİ (EVENTS) ---

// Vardiyayı Tamamla/İptal Et Buton Tıklaması
document.getElementById("done-btn").addEventListener("click", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayShiftKey = getShiftStartDate(today);

    const index = completedShifts.indexOf(todayShiftKey);
    if (index > -1) {
        // Zaten tamamlanmışsa listeden çıkar (Geri al)
        completedShifts.splice(index, 1);
    } else {
        // Tamamlanmamışsa ekle
        completedShifts.push(todayShiftKey);
    }

    // Kaydet ve Ekranı Güncelle
    localStorage.setItem("completedShifts", JSON.stringify(completedShifts));
    renderApp();
});

// Ayarlar Paneli Aç / Kapat (HTML'den kaldırıldığı için geçici olarak pasif)
/*
const modal = document.getElementById("settings-modal");
document.getElementById("settings-toggle-btn").addEventListener("click", () => {
    document.getElementById("name1-input").value = userA;
    document.getElementById("name2-input").value = userB;
    document.getElementById("ref-date-input").value = refDateStr;
    modal.classList.add("open");
});

document.getElementById("close-modal-btn").addEventListener("click", () => {
    modal.classList.remove("open");
});

// Ayarları Kaydet
document.getElementById("save-settings-btn").addEventListener("click", () => {
    const nameAVal = document.getElementById("name1-input").value.trim();
    const nameBVal = document.getElementById("name2-input").value.trim();
    const refDateVal = document.getElementById("ref-date-input").value;

    if (nameAVal) userA = nameAVal;
    if (nameBVal) userB = nameBVal;
    if (refDateVal) refDateStr = refDateVal;

    localStorage.setItem("userA", userA);
    localStorage.setItem("userB", userB);
    localStorage.setItem("refDate", refDateStr);

    refDate = new Date(refDateStr);
    refDate.setHours(0, 0, 0, 0);

    modal.classList.remove("open");
    renderApp();
});

// Modalın dışına tıklayınca kapatma
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("open");
    }
});
*/

// --- UYGULAMAYI BAŞLAT ---
renderApp();

// Service Worker Kaydı (PWA için)
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then((reg) => console.log("Service Worker başarıyla kaydedildi.", reg))
            .catch((err) => console.error("Service Worker kaydı başarısız.", err));
    });
}
