
import React from 'react';
import SubPageHeader from '../components/SubPageHeader';

const TermsScreen: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <SubPageHeader title="الشروط والأحكام" backPath="/" />
      <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6 text-slate-700 dark:text-slate-300">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">شروط وأحكام استخدام منصة سـلـتـي</h1>
          <p>آخر تحديث: 20 سبتمبر 2025</p>

          <h2 className="text-2xl font-bold mt-8">1. مقدمة</h2>
          <p>
            مرحبًا بك في منصة Salati™ ("المنصة"). هذه الشروط والأحكام ("الشروط") تحكم استخدامك لمنصتنا وخدماتنا. من خلال الوصول إلى المنصة أو استخدامها، فإنك توافق على الالتزام بهذه الشروط.
          </p>

          <h2 className="text-2xl font-bold mt-8">2. استخدام المنصة</h2>
          <p>
            يجب أن تكون في السن القانوني لإبرام عقد ملزم لاستخدام خدماتنا. أنت مسؤول عن الحفاظ على سرية معلومات حسابك وعن جميع الأنشطة التي تحدث تحت حسابك.
          </p>

          <h2 className="text-2xl font-bold mt-8">3. الطلبات والدفع</h2>
          <p>
            جميع الطلبات تخضع للتوافر. نحن نحتفظ بالحق في رفض أو إلغاء أي طلب لأي سبب. حاليًا، طريقة الدفع المتاحة هي الدفع نقدًا عند الاستلام.
          </p>

          <h2 className="text-2xl font-bold mt-8">4. الملكية الفكرية</h2>
          <p>
            جميع المحتويات على هذه المنصة، بما في ذلك النصوص والرسومات والشعارات والصور، هي ملك لـ Salati™ ومحمية بموجب قوانين حقوق النشر والعلامات التجارية. العلامة التجارية "Salati" وشعارها هما علامتان تجاريتان مسجلتان ولا يجوز استخدامهما دون إذن كتابي صريح منا.
          </p>
          
          <h2 className="text-2xl font-bold mt-8">5. حدود المسؤولية</h2>
          <p>
            لن تكون منصة Salati™ مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة تنشأ عن أو فيما يتعلق باستخدامك للمنصة أو عدم قدرتك على استخدامها.
          </p>

          <h2 className="text-2xl font-bold mt-8">6. تغيير الشروط</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة، ويعتبر استمرار استخدامك للمنصة بعد هذه التغييرات موافقة منك على الشروط المعدلة.
          </p>

          <h2 className="text-2xl font-bold mt-8">7. معلومات الاتصال</h2>
          <p>
            إذا كان لديك أي أسئلة حول هذه الشروط، يرجى التواصل معنا عبر البريد الإلكتروني الرسمي: <a href="mailto:salati.sudan@gmail.com" className="text-primary hover:underline">salati.sudan@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;
