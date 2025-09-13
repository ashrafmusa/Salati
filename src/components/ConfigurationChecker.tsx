import React from 'react';

const firebaseConfigKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const otherConfigKeys = [
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_UPLOAD_PRESET',
    'VITE_GEMINI_API_KEY',
];

const ConfigurationChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIX: Cast `import.meta` to `any` to resolve TypeScript error "Property 'env' does not exist on type 'ImportMeta'" when accessing environment variables in Vite.
  const env = (import.meta as any).env;
  const missingKeys = [...firebaseConfigKeys, ...otherConfigKeys].filter(key => {
    return !env[key];
  });

  if (missingKeys.length > 0) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#FFFBEB', color: '#92400E', minHeight: '100vh', direction: 'rtl' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#B45309' }}>خطأ في إعدادات التهيئة (Configuration Error)</h1>
        <p style={{ marginTop: '1rem' }}>
          يبدو أن التطبيق لا يمكنه العثور على متغيرات البيئة (environment variables) المطلوبة للاتصال بالخدمات الخلفية مثل Firebase.
        </p>
        <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
          هذه ليست مشكلة في الكود البرمجي، بل هي مشكلة في إعدادات النشر (Deployment Configuration).
        </p>
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '0.5rem' }}>
          <h2 style={{ fontWeight: 'bold' }}>المتغيرات المفقودة:</h2>
          <ul style={{ listStyle: 'disc', marginRight: '1.5rem', marginTop: '0.5rem' }}>
            {missingKeys.map(key => <li key={key} style={{ fontFamily: 'monospace' }}>{key}</li>)}
          </ul>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '2px solid #FDE68A', paddingBottom: '0.5rem' }}>كيفية حل المشكلة:</h2>
          <ol style={{ listStyle: 'decimal', marginRight: '1.5rem', marginTop: '1rem', lineHeight: '1.7' }}>
            <li>
              <strong>تحقق من متغيرات البيئة في منصة الاستضافة (Netlify/Vercel):</strong>
              <ul style={{ listStyle: 'circle', marginRight: '1.5rem' }}>
                <li>اذهب إلى لوحة تحكم موقعك في منصة الاستضافة.</li>
                <li>ابحث عن قسم "Environment Variables".</li>
                <li>تأكد من أنك قمت بإضافة <strong>كل</strong> المتغيرات المذكورة أعلاه بنفس الاسم والقيمة الصحيحة من ملف <code>.env</code> المحلي.</li>
              </ul>
            </li>
            <li style={{ marginTop: '1rem' }}>
              <strong>أعد نشر الموقع (Redeploy):</strong>
              <ul style={{ listStyle: 'circle', marginRight: '1.5rem' }}>
                <li>بعد التأكد من صحة المتغيرات، يجب عليك إعادة بناء ونشر الموقع.</li>
                <li>ابحث عن خيار مثل "Trigger deploy" واختر <strong>"Deploy site"</strong> أو <strong>"Clear cache and deploy site"</strong>.</li>
              </ul>
            </li>
             <li style={{ marginTop: '1rem' }}>
              <strong>إذا استمرت المشكلة:</strong>
              <ul style={{ listStyle: 'circle', marginRight: '1.5rem' }}>
                <li>تأكد من أنك أضفت نطاقك <strong>salati-e.org</strong> إلى قائمة "Authorized domains" في إعدادات Firebase Authentication.</li>
                <li>تأكد من أنك قمت بنشر قواعد Firestore الصحيحة من ملف <code>FIREBASE_SETUP.md</code>.</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  // If all keys are present, render the app.
  return <>{children}</>;
};

export default ConfigurationChecker;