const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'frontend/src/app/claims/page.tsx');

const translations = {
  "'تم إضافة المطالبة بنجاح'": "locale === 'ar' ? 'تم إضافة المطالبة بنجاح' : 'Claim added successfully'",
  "'حدث خطأ أثناء حفظ المطالبة'": "locale === 'ar' ? 'حدث خطأ أثناء حفظ المطالبة' : 'Error saving claim'",
  "'تم تعديل المطالبة بنجاح'": "locale === 'ar' ? 'تم تعديل المطالبة بنجاح' : 'Claim updated successfully'",
  "'حدث خطأ أثناء تعديل المطالبة'": "locale === 'ar' ? 'حدث خطأ أثناء تعديل المطالبة' : 'Error updating claim'",
  "'رقم المطالبة'": "locale === 'ar' ? 'رقم المطالبة' : 'Claim Number'",
  "'تاريخ المطالبة'": "locale === 'ar' ? 'تاريخ المطالبة' : 'Claim Date'",
  "'اسم العميل'": "locale === 'ar' ? 'اسم العميل' : 'Client Name'",
  "'رقم الوثيقة'": "locale === 'ar' ? 'رقم الوثيقة' : 'Policy Number'",
  "'مبلغ المطالبة'": "locale === 'ar' ? 'مبلغ المطالبة' : 'Claim Amount'",
  "'الحالة'": "locale === 'ar' ? 'الحالة' : 'Status'",
  "'قيد المراجعة'": "locale === 'ar' ? 'قيد المراجعة' : 'Pending Review'",
  "'تحت الإجراء'": "locale === 'ar' ? 'تحت الإجراء' : 'In Progress'",
  "'مقبولة'": "locale === 'ar' ? 'مقبولة' : 'Approved'",
  "'مرفوضة'": "locale === 'ar' ? 'مرفوضة' : 'Rejected'",
  "'مغلقة'": "locale === 'ar' ? 'مغلقة' : 'Closed'",
  "'إجراءات'": "locale === 'ar' ? 'إجراءات' : 'Actions'",
  "إدارة المطالبات": "{locale === 'ar' ? 'إدارة المطالبات' : 'Claims Management'}",
  "قائمة المطالبات": "{locale === 'ar' ? 'قائمة المطالبات' : 'Claims List'}",
  "'ابحث هنا...'": "locale === 'ar' ? 'ابحث هنا...' : 'Search here...'",
  "إضافة مطالبة جديدة": "{locale === 'ar' ? 'إضافة مطالبة جديدة' : 'Add New Claim'}",
  "الوثيقة المرتبطة *": "{locale === 'ar' ? 'الوثيقة المرتبطة *' : 'Related Policy *'}",
  "'ابحث برقم الوثيقة أو اسم العميل...'": "locale === 'ar' ? 'ابحث برقم الوثيقة أو اسم العميل...' : 'Search by policy number or client name...'",
  "لا توجد وثائق مطابقة 🔍": "{locale === 'ar' ? 'لا توجد وثائق مطابقة 🔍' : 'No matching policies 🔍'}",
  "وصف المطالبة *": "{locale === 'ar' ? 'وصف المطالبة *' : 'Claim Description *'}",
  "حفظ المطالبة": "{locale === 'ar' ? 'حفظ المطالبة' : 'Save Claim'}",
  "إلغاء": "{locale === 'ar' ? 'إلغاء' : 'Cancel'}",
  "تفاصيل المطالبة #": "{locale === 'ar' ? 'تفاصيل المطالبة #' : 'Claim Details #'}",
  "حالة المطالبة": "{locale === 'ar' ? 'حالة المطالبة' : 'Claim Status'}",
  "تاريخ تقديم المطالبة": "{locale === 'ar' ? 'تاريخ تقديم المطالبة' : 'Claim Submission Date'}",
  "سبب الرفض": "{locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}",
  "إغلاق": "{locale === 'ar' ? 'إغلاق' : 'Close'}",
  "تعديل المطالبة #": "{locale === 'ar' ? 'تعديل المطالبة #' : 'Edit Claim #'}",
  "اختر الوثيقة...": "{locale === 'ar' ? 'اختر الوثيقة...' : 'Select Policy...'}",
  "'اكتب سبب رفض المطالبة هنا...'": "locale === 'ar' ? 'اكتب سبب رفض المطالبة هنا...' : 'Write rejection reason here...'",
  "حفظ التعديلات": "{locale === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}",
  "سبب الرفض *": "{locale === 'ar' ? 'سبب الرفض *' : 'Rejection Reason *'}",
  "حالة المطالبة *": "{locale === 'ar' ? 'حالة المطالبة *' : 'Claim Status *'}",
  "وصف المطالبة": "{locale === 'ar' ? 'وصف المطالبة' : 'Claim Description'}",
  "مبلغ المطالبة *": "{locale === 'ar' ? 'مبلغ المطالبة *' : 'Claim Amount *'}",
  "رقم المطالبة *": "{locale === 'ar' ? 'رقم المطالبة *' : 'Claim Number *'}"
};

if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');

  // Add import if not exists
  if (!content.includes('useLanguage')) {
    content = content.replace(
      'import { useEffect, useState } from \'react\';',
      "import { useEffect, useState } from 'react';\nimport { useLanguage } from '../components/LanguageContext';"
    );
  }

  // Add hook inside component if not exists
  const funcMatch = content.match(/export default function Claims\(\) \{/);
  if (funcMatch && !content.includes('const { locale } = useLanguage();')) {
    content = content.replace(
      funcMatch[0],
      funcMatch[0] + "\n  const { locale } = useLanguage();"
    );
  }

  // Handle regular strings
  for (const [key, value] of Object.entries(translations)) {
    if (key.startsWith("'") && key.endsWith("'")) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      content = content.replace(new RegExp(escapedKey, 'g'), value);
    } else {
      // For JSX text nodes
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      content = content.replace(new RegExp('>' + escapedKey + '<', 'g'), '>' + value + '<');
    }
  }

  // Special inline properties
  content = content.replace(/placeholder="ابحث هنا..."/g, "placeholder={locale === 'ar' ? 'ابحث هنا...' : 'Search here...'}");
  content = content.replace(/placeholder="ابحث برقم الوثيقة أو اسم العميل..."/g, "placeholder={locale === 'ar' ? 'ابحث برقم الوثيقة أو اسم العميل...' : 'Search by policy number or client name...'}");
  content = content.replace(/placeholder="اكتب سبب رفض المطالبة هنا..."/g, "placeholder={locale === 'ar' ? 'اكتب سبب رفض المطالبة هنا...' : 'Write rejection reason here...'}");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Translated ' + file);
} else {
  console.log('File not found: ' + file);
}
