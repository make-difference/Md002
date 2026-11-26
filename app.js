// --- 1. Data Management (Firebase Realtime Database + Local) ---
const FIREBASE_DB_URL = 'https://md-app1-default-rtdb.firebaseio.com';
const CUSTOMERS_NODE_URL = `${FIREBASE_DB_URL}/customers.json`;
const ROOT_DB_URL = `${FIREBASE_DB_URL}/.json`;

let customers = JSON.parse(localStorage.getItem('mtd_customers')) || [];
let lastId = parseInt(localStorage.getItem('mtd_last_id')) || 0;

function normalizeCustomersArray(rawData) {
    let list = [];
    if (Array.isArray(rawData)) {
        list = rawData.filter(item => item && typeof item === 'object');
    } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.customers)) {
            list = rawData.customers.filter(item => item && typeof item === 'object');
        } else {
            list = Object.values(rawData).filter(item => item && typeof item === 'object');
        }
    }

    return list.map(c => ({
        ...c,
        id: String(c.id || '').padStart(5, '0'),
        meals: {
            chicken: parseInt(c.meals?.chicken) || 0,
            beef: parseInt(c.meals?.beef) || 0,
            fish: parseInt(c.meals?.fish) || 0,
            shrimp: parseInt(c.meals?.shrimp) || 0,
            snacks: parseInt(c.meals?.snacks) || 0
        },
        weights: {
            protein: parseInt(c.weights?.protein) || 0,
            carb: parseInt(c.weights?.carb) || 0
        }
    }));
}

function computeMaxId(list) {
    let maxNum = 0;
    list.forEach(c => {
        const num = parseInt(c.id, 10);
        if (!isNaN(num) && num > maxNum) {
            maxNum = num;
        }
    });
    return maxNum;
}

async function loadDataFromCloud() {
    try {
        // نحاول أولاً قراءة العقدة customers، وإذا كانت فارغة نقرأ الجذر (في حال رُفعت المصفوفة مباشرة في /)
        let response = await fetch(CUSTOMERS_NODE_URL);
        let data = await response.json();

        if (!data) {
            const rootRes = await fetch(ROOT_DB_URL);
            const rootData = await rootRes.json();
            if (rootData) {
                data = rootData;
            }
        }

        if (data) {
            customers = normalizeCustomersArray(data);
            const maxExistingId = computeMaxId(customers);
            lastId = Math.max(parseInt(localStorage.getItem('mtd_last_id')) || 0, maxExistingId);

            localStorage.setItem('mtd_customers', JSON.stringify(customers));
            localStorage.setItem('mtd_last_id', lastId);

            const regIdField = document.getElementById('reg-id');
            if (regIdField) regIdField.value = String(lastId + 1).padStart(5, '0');
            console.log("تمت المزامنة مع Firebase Realtime Database بنجاح");
        }
    } catch (error) {
        console.log("العمل في وضع الاوفلاين أو جاري المزامنة...", error);
    }
}

async function saveData() {
    localStorage.setItem('mtd_customers', JSON.stringify(customers));
    localStorage.setItem('mtd_last_id', lastId);

    try {
        await fetch(CUSTOMERS_NODE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customers)
        });
    } catch (error) {
        console.log("فشلت المزامنة مع Firebase، سيتم المحاولة لاحقاً", error);
    }
}

function generateId() {
    lastId++;
    return String(lastId).padStart(5, '0');
}

// --- 2. Navigation (التنقل بين الصفحات) ---
function nav(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    if(pageId !== 'renew-form') {
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
    }
    
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.style.display = 'block';

    if (typeof event !== 'undefined' && event && event.target && event.target.tagName === 'BUTTON' && pageId !== 'renew-form') {
        event.target.classList.add('active');
    }
    
    if(pageId === 'register') {
        const regIdField = document.getElementById('reg-id');
        if (regIdField) regIdField.value = String(lastId + 1).padStart(5, '0');
    }
    if(pageId === 'tracking') loadTracking('new');
}

document.addEventListener('DOMContentLoaded', () => {
    const regIdField = document.getElementById('reg-id');
    if (regIdField) regIdField.value = String(lastId + 1).padStart(5, '0');
    loadDataFromCloud();
});

// --- 3. Registration Logic (تسجيل عميل جديد + واتساب) ---
const formRegister = document.getElementById('form-register');
if (formRegister) {
    formRegister.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const start = new Date();
        const duration = parseInt(document.getElementById('reg-duration').value);
        const end = new Date(start);
        end.setDate(end.getDate() + duration);

        const newCustomer = {
            id: generateId(),
            name: document.getElementById('reg-name').value,
            phone: document.getElementById('reg-phone').value,
            type: document.getElementById('reg-type').value,
            meals: {
                chicken: parseInt(document.getElementById('reg-chicken').value) || 0,
                beef: parseInt(document.getElementById('reg-beef').value) || 0,
                fish: parseInt(document.getElementById('reg-fish').value) || 0,
                shrimp: parseInt(document.getElementById('reg-shrimp').value) || 0,
                snacks: parseInt(document.getElementById('reg-snacks').value) || 0
            },
            weights: {
                protein: parseInt(document.getElementById('reg-protein').value) || 0,
                carb: parseInt(document.getElementById('reg-carb').value) || 0
            },
            duration: duration,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: 'active'
        };

        customers.push(newCustomer);
        await saveData();
        
        let waPhone = newCustomer.phone.trim();
        if (waPhone.startsWith('05')) {
            waPhone = '966' + waPhone.substring(1);
        }

        const waMessage = `مرحباً ${newCustomer.name} 👋
أهلاً بك في عائلة "اصنع الفرق" (MAKE DIFFERENCE)! 💛🖤
تم تفعيل اشتراكك بنجاح، ويسعدنا أن نكون جزءاً من رحلتك الصحية 💪

📋 *تفاصيل اشتراكك الأساسية:*
- رقم العميل: *${newCustomer.id}*
- نوع الاشتراك: ${newCustomer.type}
- المدة: ${newCustomer.duration} أيام (ينتهي في: ${new Date(newCustomer.endDate).toLocaleDateString('ar-SA')})

🍱 *تفاصيل الوجبات والماكروز:*
- الأوزان: (بروتين: ${newCustomer.weights.protein}g | كارب: ${newCustomer.weights.carb}g)
- الحصص: (دجاج: ${newCustomer.meals.chicken} | لحم: ${newCustomer.meals.beef} | سمك: ${newCustomer.meals.fish} | روبيان: ${newCustomer.meals.shrimp} | سناكس: ${newCustomer.meals.snacks})

🌟 *رأيك يصنع الفرق!*
سعادتك تهمنا، ونتمنى منك تقييم تجربتك معنا عبر الرابط التالي:
Https://maps.app.goo.gl/V9Bxgts76BFxKLVEA?g_st=ic

نتمنى لك يوماً مليئاً بالطاقة والصحة! ✨`;

        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank'); 

        alert('تم حفظ العميل! سيتم فتح الواتساب لإرسال التفاصيل.');
        this.reset();
        document.getElementById('reg-id').value = String(lastId + 1).padStart(5, '0');
    });
}

// --- 4. Search and Consume Logic (البحث والاستهلاك) ---
function searchCustomer(context) {
    const query = document.getElementById(`search-${context}`).value.toLowerCase();
    const resultDiv = document.getElementById(`${context}-results`);
    resultDiv.innerHTML = '';

    const found = customers.filter(c => {
        const formattedId = String(c.id).padStart(5, '0');
        return formattedId.includes(query) || 
               String(c.name || '').toLowerCase().includes(query) || 
               String(c.phone || '').includes(query);
    });

    if (found.length === 0) {
        resultDiv.innerHTML = '<p>لم يتم العثور على نتائج.</p>';
        return;
    }

    found.forEach(c => {
        const displayId = String(c.id).padStart(5, '0');
        const daysLeft = Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        let html = `<div class="card">
            <h3>${c.name} (#${displayId})</h3>
            <p>الجوال: ${c.phone}</p>
            <p>النوع: ${c.type}</p>
            <p>الأيام المتبقية: ${daysLeft > 0 ? daysLeft : 0}</p>
            <hr>`;

        if (context === 'renew') {
            html += `
                <button onclick="openRenewForm('${displayId}')" class="btn-primary" style="margin-bottom:5px;">🔄 تجديد الاشتراك والوجبات</button>
                <button onclick="deleteCustomer('${displayId}')" class="btn-danger">🗑️ حذف العميل</button>
            </div>`;
        } else if (context === 'consume') {
            html += `
                <div class="grid-2">
                    <div>🍗 دجاج: ${c.meals.chicken} <br><input type="number" id="con-ch-${displayId}" min="0" value="0"></div>
                    <div>🥩 لحم: ${c.meals.beef} <br><input type="number" id="con-be-${displayId}" min="0" value="0"></div>
                    <div>🐟 سمك: ${c.meals.fish} <br><input type="number" id="con-fi-${displayId}" min="0" value="0"></div>
                    <div>🍤 روبيان: ${c.meals.shrimp} <br><input type="number" id="con-sh-${displayId}" min="0" value="0"></div>
                    <div>🍪 سناكس: ${c.meals.snacks} <br><input type="number" id="con-sn-${displayId}" min="0" value="0"></div>
                </div>
                <button onclick="recordConsumption('${displayId}')" class="btn-primary" style="margin-top:10px;">💾 تسجيل الاستهلاك</button>
            </div>`;
        }
        resultDiv.innerHTML += html;
    });
}

async function recordConsumption(id) {
    const c = customers.find(x => String(x.id).padStart(5, '0') === String(id));
    if (!c) return;
    
    c.meals.chicken -= parseInt(document.getElementById(`con-ch-${id}`).value) || 0;
    c.meals.beef -= parseInt(document.getElementById(`con-be-${id}`).value) || 0;
    c.meals.fish -= parseInt(document.getElementById(`con-fi-${id}`).value) || 0;
    c.meals.shrimp -= parseInt(document.getElementById(`con-sh-${id}`).value) || 0;
    c.meals.snacks -= parseInt(document.getElementById(`con-sn-${id}`).value) || 0;
    
    if(c.meals.chicken < 0) c.meals.chicken = 0;
    if(c.meals.beef < 0) c.meals.beef = 0;
    if(c.meals.fish < 0) c.meals.fish = 0;
    if(c.meals.shrimp < 0) c.meals.shrimp = 0;
    if(c.meals.snacks < 0) c.meals.snacks = 0;

    await saveData();
    alert('تم تسجيل الاستهلاك وخصم الوجبات بنجاح');
    searchCustomer('consume');
}

// --- 5. Full Page Renew Logic (صفحة التجديد الكاملة + واتساب) ---
function openRenewForm(id) {
    const c = customers.find(x => String(x.id).padStart(5, '0') === String(id));
    if (!c) return;
    
    document.getElementById('rnw-id').value = String(c.id).padStart(5, '0');
    document.getElementById('rnw-name').value = c.name;
    document.getElementById('rnw-type').value = c.type || '';
    
    document.getElementById('rnw-chicken').value = c.meals.chicken || 0;
    document.getElementById('rnw-beef').value = c.meals.beef || 0;
    document.getElementById('rnw-fish').value = c.meals.fish || 0;
    document.getElementById('rnw-shrimp').value = c.meals.shrimp || 0;
    document.getElementById('rnw-snacks').value = c.meals.snacks || 0;
    
    document.getElementById('rnw-protein').value = c.weights ? c.weights.protein : 0;
    document.getElementById('rnw-carb').value = c.weights ? c.weights.carb : 0;
    document.getElementById('rnw-duration').value = c.duration || 0;

    nav('renew-form');
}

const formRenew = document.getElementById('form-renew');
if (formRenew) {
    formRenew.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('rnw-id').value;
        const c = customers.find(x => String(x.id).padStart(5, '0') === String(id));
        if (!c) return alert('خطأ: لم يتم العثور على العميل');

        const duration = parseInt(document.getElementById('rnw-duration').value);

        c.type = document.getElementById('rnw-type').value;
        c.duration = duration;
        
        c.meals.chicken = parseInt(document.getElementById('rnw-chicken').value) || 0;
        c.meals.beef = parseInt(document.getElementById('rnw-beef').value) || 0;
        c.meals.fish = parseInt(document.getElementById('rnw-fish').value) || 0;
        c.meals.shrimp = parseInt(document.getElementById('rnw-shrimp').value) || 0;
        c.meals.snacks = parseInt(document.getElementById('rnw-snacks').value) || 0;

        if(!c.weights) c.weights = {};
        c.weights.protein = parseInt(document.getElementById('rnw-protein').value) || 0;
        c.weights.carb = parseInt(document.getElementById('rnw-carb').value) || 0;

        c.startDate = new Date().toISOString();
        const end = new Date();
        end.setDate(end.getDate() + duration);
        c.endDate = end.toISOString();

        await saveData();

        let waPhone = String(c.phone || '').trim();
        if (waPhone.startsWith('05')) {
            waPhone = '966' + waPhone.substring(1);
        }

        const waMessage = `مرحباً ${c.name} 👋
شكراً لتجديد ثقتك في عائلة "اصنع الفرق" (MAKE DIFFERENCE)! 💛🖤
تم تجديد اشتراكك بنجاح، ومستمرين معاك في رحلتك الصحية 💪

📋 *تفاصيل اشتراكك الجديد:*
- رقم العميل: *${String(c.id).padStart(5, '0')}*
- نوع الاشتراك: ${c.type}
- المدة: ${c.duration} أيام (ينتهي في: ${new Date(c.endDate).toLocaleDateString('ar-SA')})

🍱 *تفاصيل الوجبات والماكروز:*
- الأوزان: (بروتين: ${c.weights.protein}g | كارب: ${c.weights.carb}g)
- الحصص: (دجاج: ${c.meals.chicken} | لحم: ${c.meals.beef} | سمك: ${c.meals.fish} | روبيان: ${c.meals.shrimp} | سناكس: ${c.meals.snacks})

🌟 *رأيك يصنع الفرق!*
سعادتك تهمنا، ونتمنى منك تقييم تجربتك معنا عبر الرابط التالي:
Https://maps.app.goo.gl/V9Bxgts76BFxKLVEA?g_st=ic

نتمنى لك دورة جديدة مليئة بالطاقة والصحة! ✨`;

        const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`;
        window.open(waUrl, '_blank'); 

        alert(`تم تجديد اشتراك العميل ${c.name} بنجاح! سيتم فتح الواتساب لإرسال التفاصيل.`);
        
        nav('renew');
        document.getElementById('search-renew').value = String(c.id).padStart(5, '0');
        searchCustomer('renew');
    });
}

async function deleteCustomer(id) {
    if(confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        customers = customers.filter(x => String(x.id).padStart(5, '0') !== String(id));
        await saveData();
        searchCustomer('renew');
    }
}

// --- 6. Tracking Logic (متابعة الاشتراكات) ---
let currentTrackingView = [];

function loadTracking(type) {
    const content = document.getElementById('tracking-content');
    content.innerHTML = '';
    const now = new Date();

    currentTrackingView = customers.filter(c => {
        const daysLeft = Math.ceil((new Date(c.endDate) - now) / (1000 * 60 * 60 * 24));
        const totalMeals = (c.meals.chicken || 0) + (c.meals.beef || 0) + (c.meals.fish || 0) + (c.meals.shrimp || 0) + (c.meals.snacks || 0);
        const hoursSinceStart = Math.abs(now - new Date(c.startDate)) / 36e5;

        if (type === 'new') return hoursSinceStart <= 24;
        if (type === 'expiring') return (daysLeft <= 3 && daysLeft > 0) || (totalMeals <= 3 && totalMeals > 0);
        if (type === 'expired') return daysLeft <= 0 || totalMeals <= 0;
    });

    if (currentTrackingView.length === 0) {
        content.innerHTML = '<p>لا يوجد عملاء في هذه القائمة حالياً.</p>';
        return;
    }

    currentTrackingView.forEach(c => {
        const displayId = String(c.id).padStart(5, '0');
        content.innerHTML += `<div class="card">
            <strong>${c.name} (#${displayId})</strong> - ${c.phone} <br>
            ينتهي في: ${new Date(c.endDate).toLocaleDateString('ar-SA')}
        </div>`;
    });
}

function exportTracking() {
    if(currentTrackingView.length === 0) return alert('لا توجد بيانات لتصديرها');
    
    let csv = 'ID,Name,Phone,Type,End Date\n';
    currentTrackingView.forEach(c => {
        const displayId = String(c.id).padStart(5, '0');
        csv += `${displayId},${c.name},${c.phone},${c.type},${new Date(c.endDate).toLocaleDateString()}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mtd_export.csv";
    link.click();
}

// --- 7. Backup Logic (استيراد وتصدير) ---
function exportAllData() {
    const dataStr = JSON.stringify({ customers, lastId });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'mtd_full_backup.json');
    linkElement.click();
}

function importData() {
    const file = document.getElementById('import-file').files[0];
    if (!file) return alert('يرجى اختيار ملف أولاً');

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.customers) {
                customers = normalizeCustomersArray(data.customers);
                lastId = Math.max(parseInt(data.lastId) || 0, computeMaxId(customers));
                await saveData();
                alert('تم استيراد البيانات بنجاح!');
                location.reload();
            }
        } catch(err) {
            alert('ملف غير صالح!');
        }
    }
    reader.readAsText(file);
}
