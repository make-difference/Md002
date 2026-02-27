const KEY = "subs";
const ID_KEY = "last_id";

function getData() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

function saveData(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

function nextID() {
  let id = parseInt(localStorage.getItem(ID_KEY) || "0") + 1;
  localStorage.setItem(ID_KEY, id);
  return id.toString().padStart(6, "0");
}

function addSubscriber() {
  const s = {
    id: nextID(),
    name: name.value,
    phone: phone.value,
    plan: plan.value,
    days: +duration.value,
    meals: {
      chicken: +chicken.value || 0,
      meat: +meat.value || 0,
      fish: +fish.value || 0,
      snack: +snack.value || 0
    }
  };
  const d = getData();
  d.push(s);
  saveData(d);
  alert(`تم الحفظ ✅\nID: ${s.id}`);
}

let current = null;

function searchSubscriber() {
  const q = document.getElementById("search").value;
  const d = getData();
  current = d.find(x => x.id === q || x.phone === q || x.name === q);
  if (!current) return alert("غير موجود");
  showInfo(current);
}

const KEY = "subs";
const ID_KEY = "last_id";

function getData() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function nextID() {
  let id = parseInt(localStorage.getItem(ID_KEY) || "0") + 1;
  localStorage.setItem(ID_KEY, id);
  return id.toString().padStart(6, "0");
}

// ===== إضافة =====
function addSubscriber() {
  const data = getData();

  const sub = {
    id: nextID(),
    name: name.value.trim(),
    phone: phone.value.trim(),
    plan: plan.value.trim(),
    days: +duration.value,
    meals: {
      chicken: +chicken.value || 0,
      meat: +meat.value || 0,
      fish: +fish.value || 0,
      snack: +snack.value || 0
    }
  };

  if (!sub.name || !sub.phone) {
    alert("أدخل الاسم والجوال");
    return;
  }

  data.push(sub);
  saveData(data);
  alert(`تم الحفظ ✅\nID: ${sub.id}`);
}

// ===== بحث =====
let current = null;

function searchSubscriber() {
  const q = document.getElementById("search").value.trim();
  const data = getData();

  current = data.find(
    s => s.id === q || s.phone === q || s.name === q
  );

  if (!current) {
    alert("المشترك غير موجود");
    return;
  }

  showInfo(current);
}

function showInfo(s) {
  document.getElementById("info").innerHTML = `
    <p><b>الاسم:</b> ${s.name}</p>
    <p><b>ID:</b> ${s.id}</p>
    <p><b>أيام متبقية:</b> ${s.days}</p>
    <p>🍗 ${s.meals.chicken} | 🥩 ${s.meals.meat} | 🐟 ${s.meals.fish} | 🍪 ${s.meals.snack}</p>
  `;
}

// ===== استهلاك =====
function consumeAll() {
  if (!current) {
    alert("ابحث أولاً");
    return;
  }

  current.meals.chicken -= +c1.value || 0;
  current.meals.meat -= +c2.value || 0;
  current.meals.fish -= +c3.value || 0;
  current.meals.snack -= +c4.value || 0;
  current.days--;

  const data = getData().map(s =>
    s.id === current.id ? current : s
  );

  saveData(data);
  alert("تم تسجيل الاستهلاك ✅");
  showInfo(current);
}
