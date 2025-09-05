
import React from 'react';
import SubPageHeader from '../components/SubPageHeader';

const PrivacyPolicyScreen: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SubPageHeader title="سياسة الخصوصية" backPath="/" />
      <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6 text-slate-700 dark:text-slate-300">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">سياسة خصوصية منصة سـلـتـي</h1>
          <p>آخر تحديث: 20 سبتمبر 2025</p>

          <h2 className="text-2xl font-bold mt-8">1. المعلومات التي نجمعها</h2>
          <p>
            نحن نجمع المعلومات التي تقدمها مباشرة إلينا. على سبيل المثال، نجمع المعلومات عندما تنشئ حسابًا، أو تقدم طلبًا، أو تتواصل معنا. قد تشمل هذه المعلومات:
          </p>
          <ul>
            <li>معلومات الاتصال (مثل الاسم، رقم الهاتف، عنوان البريد الإلكتروني)</li>
            <li>معلومات التوصيل (مثل العنوان)</li>
            <li>تفاصيل الطلب</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8">2. كيف نستخدم معلوماتك</h2>
          <p>
            نحن نستخدم المعلومات التي نجمعها من أجل:
          </p>
          <ul>
            <li>توفير وصيانة وتحسين خدماتنا.</li>
            <li>معالجة معاملاتك وتلبية طلباتك.</li>
            <li>التواصل معك بشأن الطلبات والعروض والخدمات.</li>
            <li>الاستجابة لتعليقاتك وأسئلتك وتقديم خدمة العملاء.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8">3. مشاركة المعلومات</h2>
          <p>
            نحن لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا كما هو موضح في هذه السياسة أو عندما نحصل على موافقتك. قد نشارك المعلومات مع السائقين لمعالجة طلبات التوصيل الخاصة بك.
          </p>
          
          <h2 className="text-2xl font-bold mt-8">4. أمن البيانات</h2>
          <p>
            نتخذ تدابير معقولة لحماية معلوماتك من الفقدان والسرقة وسوء الاستخدام والوصول غير المصرح به. يتم تخزين جميع البيانات على خوادم Firebase الآمنة.
          </p>

          <h2 className="text-2xl font-bold mt-8">5. حقوقك</h2>
          <p>
            لديك الحق في الوصول إلى معلوماتك الشخصية التي نحتفظ بها وتحديثها وتصحيحها. يمكنك مراجعة معلومات حسابك وتحديثها في أي وقت عن طريق تسجيل الدخول إلى حسابك.
          </p>

          <h2 className="text-2xl font-bold mt-8">6. معلومات الاتصال</h2>
          <p>
            إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر البريد الإلكتروني الرسمي: <a href="mailto:salati.sudan@gmail.com" className="text-primary hover:underline">salati.sudan@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;
