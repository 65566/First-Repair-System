const SUPABASE_URL = "https://aqiuggiablbxjodyfbdy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaXVnZ2lhYmxieGpvZHlmYmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzEwNzgsImV4cCI6MjA5MjY0NzA3OH0.bjDRId734bcCbv8QvEXMXQCTd69FKhnr5NnG6t57-YY";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentSection = null;
let currentUser = null;

const tables = { controllers: "users", devices: "device_users" };

const sectionTitles = {
  controllers: {
    loginTitle: "تسجيل دخول صيانة الدراعات",
    loginSubtitle: "ادخل بيانات مستخدم الدراعات",
    systemName: "صيانة الدراعات",
    systemSubName: "Controllers Repair System"
  },
  devices: {
    loginTitle: "تسجيل دخول صيانة الأجهزة",
    loginSubtitle: "ادخل بيانات مستخدم الأجهزة",
    systemName: "صيانة الأجهزة",
    systemSubName: "Devices Repair System"
  }
};

function tableForCurrentSection() {
  return tables[currentSection] || "users";
}

async function openSectionLogin(section) {
  currentSection = section;
  const titles = sectionTitles[section];
  document.getElementById("portalPage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
  document.getElementById("appLayout").classList.add("hidden");
  document.getElementById("loginTitle").textContent = titles.loginTitle;
  document.getElementById("loginSubtitle").textContent = titles.loginSubtitle;
  await loadUsersIntoLogin();
}

function backToPortal() {
  currentSection = null;
  currentUser = null;
  document.getElementById("portalPage").classList.remove("hidden");
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("appLayout").classList.add("hidden");
  clearLoginFields();
}

function clearLoginFields() {
  document.getElementById("loginUser").innerHTML = "";
  document.getElementById("loginRole").value = "";
  document.getElementById("loginPassword").value = "";
}

async function loadUsersIntoLogin() {
  const select = document.getElementById("loginUser");
  select.innerHTML = `<option value="">جاري تحميل المستخدمين...</option>`;

  const { data, error } = await db.from(tableForCurrentSection()).select("id,name,role").order("name", { ascending: true });

  if (error) {
    console.error(error);
    select.innerHTML = `<option value="">خطأ في تحميل المستخدمين</option>`;
    alert("تأكد من وجود جدول " + tableForCurrentSection() + " ومن صلاحيات القراءة في Supabase");
    return;
  }

  if (!data || data.length === 0) {
    select.innerHTML = `<option value="">لا يوجد مستخدمون</option>`;
    return;
  }

  select.innerHTML = `<option value="">اختر الاسم</option>` + data.map(u => `<option value="${u.id}">${u.name}</option>`).join("");
}

async function login() {
  const userId = document.getElementById("loginUser").value;
  const role = document.getElementById("loginRole").value;
  const password = document.getElementById("loginPassword").value.trim();

  if (!userId || !role || !password) {
    alert("من فضلك اختر الاسم والكنية واكتب الباسورد");
    return;
  }

  const { data, error } = await db
    .from(tableForCurrentSection())
    .select("*")
    .eq("id", userId)
    .eq("role", role)
    .eq("password", password)
    .single();

  if (error || !data) {
    console.error(error);
    alert("بيانات الدخول غير صحيحة");
    return;
  }

  currentUser = data;
  openDashboard();
}

function openDashboard() {
  const titles = sectionTitles[currentSection];
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("portalPage").classList.add("hidden");
  document.getElementById("appLayout").classList.remove("hidden");
  document.getElementById("systemName").textContent = titles.systemName;
  document.getElementById("systemSubName").textContent = titles.systemSubName;
  document.getElementById("userBadge").textContent = `${currentUser.name} - ${currentUser.role}`;

  document.querySelectorAll("[data-controllers]").forEach(btn => {
    btn.classList.toggle("hidden", currentSection !== "controllers");
  });

  renderHomeCards();
  showPage("home", document.querySelector("#mainMenu button"));
}

function logout() {
  currentSection = null;
  currentUser = null;
  document.getElementById("appLayout").classList.add("hidden");
  document.getElementById("portalPage").classList.remove("hidden");
  clearLoginFields();
}

function renderHomeCards() {
  const home = document.getElementById("homeSection");
  if (currentSection === "controllers") {
    home.innerHTML = `
      <div class="nav-card" onclick="showPage('new-invoice')"><h4>فاتورة جديدة</h4><p>جاهزة للربط بجداول Supabase.</p></div>
      <div class="nav-card" onclick="showPage('customers')"><h4>حسابات العملاء</h4><p>جاهزة للربط بجداول Supabase.</p></div>
      <div class="nav-card" onclick="showPage('inventory')"><h4>المخزون</h4><p>جاهزة للربط بجداول Supabase.</p></div>
      <div class="nav-card" onclick="showPage('reports')"><h4>التقارير</h4><p>جاهزة للربط بجداول Supabase.</p></div>
      <div class="nav-card" onclick="showPage('users')"><h4>إدارة المستخدمون</h4><p>جدول users.</p></div>`;
  } else {
    home.innerHTML = `
      <div class="nav-card" onclick="showPage('users')"><h4>إدارة المستخدمون</h4><p>جدول device_users.</p></div>
      <div class="nav-card" onclick="showPage('devices-start')"><h4>بداية برنامج الأجهزة</h4><p>جاهز نبدأ نبني صفحات الأجهزة.</p></div>`;
  }
}

function showPage(pageKey, btn = null) {
  document.querySelectorAll("#mainMenu button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("homeSection").classList.add("hidden");
  document.getElementById("placeholderSection").classList.add("hidden");

  if (pageKey === "home") {
    document.getElementById("pageTitle").textContent = "الصفحة الرئيسية";
    document.getElementById("pageDesc").textContent = "مرحبا بك في النظام";
    document.getElementById("homeSection").classList.remove("hidden");
    return;
  }

  const titleMap = {
    "new-invoice": "فاتورة جديدة",
    "edit-invoice": "تعديل فواتير",
    "customers": "حسابات العملاء",
    "inventory": "المخزون",
    "invoices": "إدارة الفواتير",
    "reports": "التقارير",
    "users": "إدارة المستخدمون",
    "devices-start": "برنامج صيانة الأجهزة"
  };

  document.getElementById("pageTitle").textContent = titleMap[pageKey] || "صفحة";
  document.getElementById("pageDesc").textContent = "جاهزة للربط الكامل مع Supabase.";
  document.getElementById("placeholderTitle").textContent = titleMap[pageKey] || "صفحة";
  document.getElementById("placeholderText").textContent =
    pageKey === "users"
      ? `هذه الصفحة ستتعامل مع جدول ${tableForCurrentSection()} في Supabase.`
      : "المرحلة التالية: نقل منطق هذه الصفحة بالكامل إلى Supabase.";
  document.getElementById("placeholderSection").classList.remove("hidden");
    }
