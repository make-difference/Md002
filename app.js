const KEY = "subs";

function getSubs() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

function saveSubs(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function addSubscriber() {
  const sub = {
    name: name.value,
    phone: phone.value,
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

  const data = getSubs();
  data.push(sub);
  saveSubs(data);

  alert("تم التسجيل ✅");
}

let current = null;

function search() {
  const q = document.getElementById("search").value;
  const data = getSubs();

  current = data.find(
    s => s.name === q || s.phone === q
  );

  if (!current) {
    alert("غير موجود");
    return;
  }

  document.getElementById("info").innerHTML = `
    <p>الاسم: ${current.name}</p>
    <p>الجوال: ${current.phone}</p>
    <p>🍗 ${current.meals.chicken} 🥩 ${current.meals.meat}
       🐟 ${current.meals.fish} 🍪 ${current.meals.snack}</p>
  `;
}

function consume() {
  if (!current) {
    alert("ابحث أولاً");
    return;
  }

  const n = +document.getElementById("c").value || 0;
  current.meals.chicken -= n;

  saveSubs(getSubs());
  alert("تم الاستهلاك ✅");
}
