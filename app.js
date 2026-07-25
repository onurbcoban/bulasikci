let userA = "Betül";
let userB = "Onur";
let refDateStr = "2026-07-13";
let refDate = new Date(refDateStr);
refDate.setHours(0, 0, 0, 0);

let completedShifts = JSON.parse(localStorage.getItem("completedShifts")) || [];

const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function getCycleIndex(targetDate) {
    const tDate = new Date(targetDate);
    tDate.setHours(0, 0, 0, 0);
    const diffTime = tDate - refDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return ((diffDays % 14) + 14) % 14;
}

function getAssigneeForDate(targetDate) {
    const cycleIndex = getCycleIndex(targetDate);
    if ([0, 3, 4, 5, 8, 9, 13].includes(cycleIndex)) {
        return userA;
    } else {
        return userB;
    }
}

function formatDateString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getShiftStartDate(targetDate) {
    const tDate = new Date(targetDate);
    tDate.setHours(0, 0, 0, 0);
    const cycleIndex = getCycleIndex(tDate);

    let offset = 0;
    if ([0, 2, 4, 7, 9, 11].includes(cycleIndex)) {
        offset = -1;
    } else if ([5, 12].includes(cycleIndex)) {
        offset = -2;
    }

    const startDate = new Date(tDate);
    startDate.setDate(startDate.getDate() + offset);
    return formatDateString(startDate);
}

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

function renderApp() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.getElementById("leaf-day-name").innerText = dayNames[today.getDay()];
    document.getElementById("leaf-day-num").innerText = today.getDate();
    document.getElementById("leaf-month").innerText = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

    const todayAssignee = getAssigneeForDate(today);
    const leafAssignee = document.getElementById("leaf-assignee");
    leafAssignee.innerText = todayAssignee;
    leafAssignee.className = "leaf-assignee " + (todayAssignee === userA ? "user-a" : "user-b");

    const calendarGrid = document.getElementById("calendar-grid");
    calendarGrid.innerHTML = "";

    const weekDates = getWeeklyDates(today);

    weekDates.forEach((date, index) => {
        const card = document.createElement("div");
        card.className = "day-card";

        if (index === 0 || index === 8) {
            card.classList.add("preview");
        }

        if (date.getTime() === today.getTime()) {
            card.classList.add("today");
        }

        const shiftKey = getShiftStartDate(date);
        if (completedShifts.includes(shiftKey)) {
            card.classList.add("completed");
        }

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

        const dayNumber = document.createElement("span");
        dayNumber.className = "day-number";
        dayNumber.innerText = date.getDate();

        const assignee = getAssigneeForDate(date);
        const dayAssignee = document.createElement("span");
        dayAssignee.className = `day-assignee ${assignee === userA ? 'user-a' : 'user-b'}`;
        dayAssignee.innerText = assignee;

        card.appendChild(dayLabel);
        card.appendChild(dayNumber);
        card.appendChild(dayAssignee);
        calendarGrid.appendChild(card);
    });

    const todayShiftKey = getShiftStartDate(today);
    const doneBtn = document.getElementById("done-btn");

    if (completedShifts.includes(todayShiftKey)) {
        doneBtn.classList.add("completed");
        doneBtn.querySelector(".btn-text").innerText = "Vardiya Tamamlandı";
    } else {
        doneBtn.classList.remove("completed");
        doneBtn.querySelector(".btn-text").innerText = "Vardiyamı tamamladım!";
    }

    renderPlates(today);

    requestAnimationFrame(() => {
        centerTodayCard();
    });
}

function centerTodayCard() {
    const wrapper = document.querySelector('.calendar-wrapper');
    const todayCard = document.querySelector('.day-card.today');
    if (wrapper && todayCard) {
        const cardRect = todayCard.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const scrollOffset = (cardRect.left + cardRect.width / 2) - (wrapperRect.left + wrapperRect.width / 2);
        wrapper.scrollLeft += scrollOffset;
    }
}

function renderPlates(today) {
    const diffTime = today - refDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const blockStartDiff = Math.floor(diffDays / 28) * 28;

    const blockStartDate = new Date(refDate);
    blockStartDate.setDate(blockStartDate.getDate() + blockStartDiff);

    const userAShiftOffsets = [-1, 3, 8, 13, 17, 22];
    const userBShiftOffsets = [1, 6, 10, 15, 20, 24];

    let completedCountA = 0;
    let completedCountB = 0;

    userAShiftOffsets.forEach(offset => {
        const shiftDate = new Date(blockStartDate);
        shiftDate.setDate(shiftDate.getDate() + offset);
        const key = formatDateString(shiftDate);
        if (completedShifts.includes(key)) {
            completedCountA++;
        }
    });

    userBShiftOffsets.forEach(offset => {
        const shiftDate = new Date(blockStartDate);
        shiftDate.setDate(shiftDate.getDate() + offset);
        const key = formatDateString(shiftDate);
        if (completedShifts.includes(key)) {
            completedCountB++;
        }
    });

    const platesA = document.querySelectorAll("#stack-user-a .plate-line");
    const platesB = document.querySelectorAll("#stack-user-b .plate-line");

    document.getElementById("stack-name-a").innerText = userA;
    document.getElementById("stack-name-b").innerText = userB;

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

document.getElementById("done-btn").addEventListener("click", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayShiftKey = getShiftStartDate(today);

    const index = completedShifts.indexOf(todayShiftKey);
    if (index > -1) {
        completedShifts.splice(index, 1);
    } else {
        completedShifts.push(todayShiftKey);
    }

    localStorage.setItem("completedShifts", JSON.stringify(completedShifts));
    renderApp();
});

renderApp();

window.addEventListener("load", centerTodayCard);
window.addEventListener("resize", centerTodayCard);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(centerTodayCard);
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then((reg) => console.log("Service Worker kaydedildi.", reg))
            .catch((err) => console.error("Service Worker kaydı başarısız.", err));
    });
}
