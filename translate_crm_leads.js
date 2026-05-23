const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'frontend/src/app/crm/page.tsx'),
  path.join(__dirname, 'frontend/src/app/leads/page.tsx')
];

const translations = {
  "'سيارات'": "locale === 'ar' ? 'سيارات' : 'Auto'",
  "'صحي'": "locale === 'ar' ? 'صحي' : 'Health'",
  "'حياة'": "locale === 'ar' ? 'حياة' : 'Life'",
  "'ممتلكات'": "locale === 'ar' ? 'ممتلكات' : 'Property'",
  "'فعالة'": "locale === 'ar' ? 'فعالة' : 'Active'",
  "'منتهية'": "locale === 'ar' ? 'منتهية' : 'Expired'",
  "'ملغاة'": "locale === 'ar' ? 'ملغاة' : 'Cancelled'",
  "'مكالمة'": "locale === 'ar' ? 'مكالمة' : 'Call'",
  "'بريد'": "locale === 'ar' ? 'بريد' : 'Email'",
  "'اجتماع'": "locale === 'ar' ? 'اجتماع' : 'Meeting'",
  "'هذا الحقل مطلوب'": "locale === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required'",
  "'العنوان مطلوب'": "locale === 'ar' ? 'العنوان مطلوب' : 'Address is required'",
  "'المحافظة مطلوبة'": "locale === 'ar' ? 'المحافظة مطلوبة' : 'Governorate is required'",
  "'البريد الإلكتروني مطلوب للشركات'": "locale === 'ar' ? 'البريد الإلكتروني مطلوب للشركات' : 'Email is required for corporate'",
  "'يجب أن يتكون من 11 رقم'": "locale === 'ar' ? 'يجب أن يتكون من 11 رقم' : 'Must be 11 digits'",
  "'رقم الهاتف مكرر لايمكن اضافة عميل'": "locale === 'ar' ? 'رقم الهاتف مكرر لايمكن اضافة عميل' : 'Phone number is duplicated, cannot add client'",
  "'صيغة البريد الإلكتروني غير صحيحة'": "locale === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'",
  "'تم إضافة عميل بنجاح'": "locale === 'ar' ? 'تم إضافة عميل بنجاح' : 'Client added successfully'",
  "'حدث خطأ: البريد الإلكتروني مستخدم بالفعل لعميل آخر.'": "locale === 'ar' ? 'حدث خطأ: البريد الإلكتروني مستخدم بالفعل لعميل آخر.' : 'Error: Email is already used for another client.'",
  "'حدث خطأ أثناء الحفظ: '": "locale === 'ar' ? 'حدث خطأ أثناء الحفظ: ' : 'Error during saving: '",
  "'حدث خطأ أثناء التحديث: '": "locale === 'ar' ? 'حدث خطأ أثناء التحديث: ' : 'Error during update: '",
  "'هل أنت متأكد من حذف هذا العميل؟'": "locale === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?'",
  "'تم تجديد الوثيقة بنجاح!'": "locale === 'ar' ? 'تم تجديد الوثيقة بنجاح!' : 'Policy renewed successfully!'",
  "'تم طلب تجديد الوثيقة بنجاح!'": "locale === 'ar' ? 'تم طلب تجديد الوثيقة بنجاح!' : 'Policy renewal requested successfully!'",
  "'حدث خطأ أثناء التجديد'": "locale === 'ar' ? 'حدث خطأ أثناء التجديد' : 'Error during renewal'",
  "'حدث خطأ أثناء تجديد الوثيقة'": "locale === 'ar' ? 'حدث خطأ أثناء تجديد الوثيقة' : 'Error during policy renewal'",
  "'جاري التحميل...'": "locale === 'ar' ? 'جاري التحميل...' : 'Loading...'",
  "إدارة العملاء (CRM)": "{locale === 'ar' ? 'إدارة العملاء (CRM)' : 'Customer Management (CRM)'}",
  "إدارة العملاء المحتملين": "{locale === 'ar' ? 'إدارة العملاء المحتملين' : 'Lead Management'}",
  "'إجمالي العملاء الفعليين'": "locale === 'ar' ? 'إجمالي العملاء الفعليين' : 'Total Active Clients'",
  "'إجمالي المحتملين'": "locale === 'ar' ? 'إجمالي المحتملين' : 'Total Leads'",
  "'وثائق نشطة'": "locale === 'ar' ? 'وثائق نشطة' : 'Active Policies'",
  "'وثائق فعالة'": "locale === 'ar' ? 'وثائق فعالة' : 'Active Policies'",
  "'عملاء هذا الشهر'": "locale === 'ar' ? 'عملاء هذا الشهر' : 'Clients This Month'",
  "'جديد هذا الشهر'": "locale === 'ar' ? 'جديد هذا الشهر' : 'New This Month'",
  "'سجلات تواصل'": "locale === 'ar' ? 'سجلات تواصل' : 'Communication Logs'",
  "'التواصل'": "locale === 'ar' ? 'التواصل' : 'Communications'",
  "قائمة العملاء": "{locale === 'ar' ? 'قائمة العملاء' : 'Client List'}",
  "'ابحث بالاسم أو البريد أو الهاتف...'": "locale === 'ar' ? 'ابحث بالاسم أو البريد أو الهاتف...' : 'Search by name, email, or phone...'",
  "الكل (أفراد وشركات)": "{locale === 'ar' ? 'الكل (أفراد وشركات)' : 'All (Individuals & Corporate)'}",
  "أفراد فقط": "{locale === 'ar' ? 'أفراد فقط' : 'Individuals Only'}",
  "شركات فقط": "{locale === 'ar' ? 'شركات فقط' : 'Corporate Only'}",
  "لا توجد نتائج": "{locale === 'ar' ? 'لا توجد نتائج' : 'No results found'}",
  "'لا يوجد هاتف'": "locale === 'ar' ? 'لا يوجد هاتف' : 'No phone'",
  "وثيقة": "{locale === 'ar' ? 'وثيقة' : 'Policy'}",
  "السابق": "{locale === 'ar' ? 'السابق' : 'Previous'}",
  "صفحة ": "{locale === 'ar' ? 'صفحة ' : 'Page '}",
  " من ": "{locale === 'ar' ? ' من ' : ' of '}",
  "التالي": "{locale === 'ar' ? 'التالي' : 'Next'}",
  "عميل منذ ": "{locale === 'ar' ? 'عميل منذ ' : 'Client since '}",
  "إغلاق": "{locale === 'ar' ? 'إغلاق' : 'Close'}",
  "تعديل": "{locale === 'ar' ? 'تعديل' : 'Edit'}",
  "حذف": "{locale === 'ar' ? 'حذف' : 'Delete'}",
  "'البريد الإلكتروني'": "locale === 'ar' ? 'البريد الإلكتروني' : 'Email'",
  "'رقم الهاتف'": "locale === 'ar' ? 'رقم الهاتف' : 'Phone Number'",
  "'رقم هاتف إضافي'": "locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone'",
  "'التصنيف'": "locale === 'ar' ? 'التصنيف' : 'Classification'",
  "'شركات'": "locale === 'ar' ? 'شركات' : 'Corporate'",
  "'فردي'": "locale === 'ar' ? 'فردي' : 'Individual'",
  "'الحالة'": "locale === 'ar' ? 'الحالة' : 'Status'",
  "'عميل محتمل (Lead)'": "locale === 'ar' ? 'عميل محتمل (Lead)' : 'Lead'",
  "'نشط'": "locale === 'ar' ? 'نشط' : 'Active'",
  "'غير نشط'": "locale === 'ar' ? 'غير نشط' : 'Inactive'",
  "'العنوان'": "locale === 'ar' ? 'العنوان' : 'Address'",
  "'رقم الهوية'": "locale === 'ar' ? 'رقم الهوية' : 'National ID'",
  "'تاريخ الميلاد'": "locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'",
  "'اسم الأم'": "locale === 'ar' ? 'اسم الأم' : 'Mother Name'",
  "'اسم الجد'": "locale === 'ar' ? 'اسم الجد' : 'Grandfather Name'",
  "'نوع الشركة'": "locale === 'ar' ? 'نوع الشركة' : 'Company Type'",
  "'القطاع / النشاط'": "locale === 'ar' ? 'القطاع / النشاط' : 'Industry'",
  "'غرفة التجارة'": "locale === 'ar' ? 'غرفة التجارة' : 'Chamber of Commerce'",
  "'رقم التسجيل'": "locale === 'ar' ? 'رقم التسجيل' : 'Registration Number'",
  "'المحافظة'": "locale === 'ar' ? 'المحافظة' : 'Governorate'",
  "'اسم المدير المفوض'": "locale === 'ar' ? 'اسم المدير المفوض' : 'CEO Name'",
  "'عدد الفروع'": "locale === 'ar' ? 'عدد الفروع' : 'Number of Branches'",
  "'عدد الموظفين'": "locale === 'ar' ? 'عدد الموظفين' : 'Number of Employees'",
  "'تاريخ التسجيل'": "locale === 'ar' ? 'تاريخ التسجيل' : 'Registration Date'",
  "'أُضيف بواسطة'": "locale === 'ar' ? 'أُضيف بواسطة' : 'Added By'",
  "'آخر تعديل'": "locale === 'ar' ? 'آخر تعديل' : 'Last Modified'",
  "وثائق العميل": "{locale === 'ar' ? 'وثائق العميل' : 'Client Documents'}",
  "الهوية - الوجه الأمامي": "{locale === 'ar' ? 'الهوية - الوجه الأمامي' : 'ID - Front'}",
  "الهوية الأمامية": "{locale === 'ar' ? 'الهوية الأمامية' : 'Front ID'}",
  "الهوية - الوجه الخلفي": "{locale === 'ar' ? 'الهوية - الوجه الخلفي' : 'ID - Back'}",
  "الهوية الخلفية": "{locale === 'ar' ? 'الهوية الخلفية' : 'Back ID'}",
  "وثائق أخرى": "{locale === 'ar' ? 'وثائق أخرى' : 'Other Documents'}",
  "عرض الوثيقة": "{locale === 'ar' ? 'عرض الوثيقة' : 'View Document'}",
  "لا توجد وثائق لهذا العميل": "{locale === 'ar' ? 'لا توجد وثائق لهذا العميل' : 'No policies for this client'}",
  "تجديد": "{locale === 'ar' ? 'تجديد' : 'Renew'}",
  "سجل التواصل (": "{locale === 'ar' ? 'سجل التواصل (' : 'Communication Log ('}",
  "إضافة تواصل": "{locale === 'ar' ? 'إضافة تواصل' : 'Add Communication'}",
  "لا يوجد سجل تواصل بعد": "{locale === 'ar' ? 'لا يوجد سجل تواصل بعد' : 'No communication log yet'}",
  "إضافة عميل جديد": "{locale === 'ar' ? 'إضافة عميل جديد' : 'Add New Client'}",
  "فردي": "{locale === 'ar' ? 'فردي' : 'Individual'}",
  "شركة": "{locale === 'ar' ? 'شركة' : 'Corporate'}",
  "'الاسم الأول *'": "locale === 'ar' ? 'الاسم الأول *' : 'First Name *'",
  "'الاسم الثاني *'": "locale === 'ar' ? 'الاسم الثاني *' : 'Second Name *'",
  "'الاسم الثالث *'": "locale === 'ar' ? 'الاسم الثالث *' : 'Third Name *'",
  "'اللقب (اختياري)'": "locale === 'ar' ? 'اللقب (اختياري)' : 'Last Name (Optional)'",
  "'اسم الأم (اختياري)'": "locale === 'ar' ? 'اسم الأم (اختياري)' : 'Mother Name (Optional)'",
  "'اسم الجد من الأم (اختياري)'": "locale === 'ar' ? 'اسم الجد من الأم (اختياري)' : 'Grandfather Name (Optional)'",
  "'رقم الهوية'": "locale === 'ar' ? 'رقم الهوية' : 'National ID'",
  "'الرجاء إدخال أرقام فقط'": "locale === 'ar' ? 'الرجاء إدخال أرقام فقط' : 'Please enter numbers only'",
  "تاريخ الميلاد": "{locale === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}",
  "الحالة": "{locale === 'ar' ? 'الحالة' : 'Status'}",
  "عميل محتمل": "{locale === 'ar' ? 'عميل محتمل' : 'Lead'}",
  "عميل نشط (تحويل)": "{locale === 'ar' ? 'عميل نشط (تحويل)' : 'Active Client (Converted)'}",
  "عميل نشط": "{locale === 'ar' ? 'عميل نشط' : 'Active Client'}",
  "عميل غير نشط": "{locale === 'ar' ? 'عميل غير نشط' : 'Inactive Client'}",
  "'البريد الإلكتروني (اختياري)'": "locale === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'",
  "'رقم الهاتف *'": "locale === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'",
  "'رقم هاتف إضافي'": "locale === 'ar' ? 'رقم هاتف إضافي' : 'Additional Phone'",
  "'العنوان *'": "locale === 'ar' ? 'العنوان *' : 'Address *'",
  "'اسم الشركة (عربي / إنكليزي) *'": "locale === 'ar' ? 'اسم الشركة (عربي / إنكليزي) *' : 'Company Name (Arabic/English) *'",
  "نوع الشركة *": "{locale === 'ar' ? 'نوع الشركة *' : 'Company Type *'}",
  "حكومية": "{locale === 'ar' ? 'حكومية' : 'Governmental'}",
  "قطاع خاص": "{locale === 'ar' ? 'قطاع خاص' : 'Private Sector'}",
  "قطاع مشترك": "{locale === 'ar' ? 'قطاع مشترك' : 'Mixed Sector'}",
  "'مجال النشاط *'": "locale === 'ar' ? 'مجال النشاط *' : 'Industry *'",
  "تاريخ التأسيس": "{locale === 'ar' ? 'تاريخ التأسيس' : 'Foundation Date'}",
  "'رقم غرفة التجارة (إن وجد)'": "locale === 'ar' ? 'رقم غرفة التجارة (إن وجد)' : 'Chamber of Commerce (if any)'",
  "'رقم التسجيل في دائرة تسجيل الشركات'": "locale === 'ar' ? 'رقم التسجيل في دائرة تسجيل الشركات' : 'Company Registration Number'",
  "'المحافظة *'": "locale === 'ar' ? 'المحافظة *' : 'Governorate *'",
  "'البريد الإلكتروني الرسمي *'": "locale === 'ar' ? 'البريد الإلكتروني الرسمي *' : 'Official Email *'",
  "'رقم الموبايل *'": "locale === 'ar' ? 'رقم الموبايل *' : 'Mobile Number *'",
  "'العنوان التفصيلي'": "locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'",
  "وثائق الهوية": "{locale === 'ar' ? 'وثائق الهوية' : 'Identity Documents'}",
  "صورة الهوية (الأمام)": "{locale === 'ar' ? 'صورة الهوية (الأمام)' : 'ID Image (Front)'}",
  "صورة الهوية (الخلف)": "{locale === 'ar' ? 'صورة الهوية (الخلف)' : 'ID Image (Back)'}",
  "وثائق أخرى (PDF, صور...)": "{locale === 'ar' ? 'وثائق أخرى (PDF, صور...)' : 'Other Documents (PDF, images...)'}",
  "حفظ": "{locale === 'ar' ? 'حفظ' : 'Save'}",
  "تعديل بيانات العميل": "{locale === 'ar' ? 'تعديل بيانات العميل' : 'Edit Client Data'}",
  "تحديث وثائق الهوية (اتركها فارغة للإبقاء على الحالية)": "{locale === 'ar' ? 'تحديث وثائق الهوية (اتركها فارغة للإبقاء على الحالية)' : 'Update ID Documents (Leave empty to keep current)'}",
  "إضافة تواصل مع": "{locale === 'ar' ? 'إضافة تواصل مع' : 'Add Communication with'}",
  "مكالمة هاتفية": "{locale === 'ar' ? 'مكالمة هاتفية' : 'Phone Call'}",
  "بريد إلكتروني": "{locale === 'ar' ? 'بريد إلكتروني' : 'Email'}",
  "اجتماع": "{locale === 'ar' ? 'اجتماع' : 'Meeting'}",
  "ملاحظات التواصل...": "{locale === 'ar' ? 'ملاحظات التواصل...' : 'Communication Notes...'}",
  "تجديد الوثيقة": "{locale === 'ar' ? 'تجديد الوثيقة' : 'Renew Policy'}",
  "يرجى إدخال البيانات الجديدة لتجديد الوثيقة": "{locale === 'ar' ? 'يرجى إدخال البيانات الجديدة لتجديد الوثيقة' : 'Please enter new data to renew the policy'}",
  "تاريخ البدء الجديد": "{locale === 'ar' ? 'تاريخ البدء الجديد' : 'New Start Date'}",
  "تاريخ الانتهاء الجديد": "{locale === 'ar' ? 'تاريخ الانتهاء الجديد' : 'New End Date'}",
  "مبلغ القسط الجديد (مثال: 1500.00)": "{locale === 'ar' ? 'مبلغ القسط الجديد (مثال: 1500.00)' : 'New Premium Amount (e.g. 1500.00)'}",
  "تأكيد التجديد": "{locale === 'ar' ? 'تأكيد التجديد' : 'Confirm Renewal'}",
  "حسناً": "{locale === 'ar' ? 'حسناً' : 'OK'}",
  "عميل جديد": "{locale === 'ar' ? 'عميل جديد' : 'New Client'}",
  "الاسم": "{locale === 'ar' ? 'الاسم' : 'Name'}",
  "البريد الإلكتروني": "{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}",
  "الهاتف": "{locale === 'ar' ? 'الهاتف' : 'Phone'}",
  "الوثائق": "{locale === 'ar' ? 'الوثائق' : 'Policies'}",
  "يرجى إدخال التواريخ الجديدة لتجديد الوثيقة": "{locale === 'ar' ? 'يرجى إدخال التواريخ الجديدة لتجديد الوثيقة' : 'Please enter new dates to renew the policy'}",
  "القسط الجديد": "{locale === 'ar' ? 'القسط الجديد' : 'New Premium'}",
  "' — '": "locale === 'ar' ? ' — ' : ' — '"
};

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Add import if not exists
  if (!content.includes('useLanguage')) {
    content = content.replace(
      'import { useEffect, useState } from \'react\';',
      "import { useEffect, useState } from 'react';\nimport { useLanguage } from '../components/LanguageContext';"
    );
  }

  // Add hook inside component if not exists
  const funcMatch = content.match(/export default function (CRM|Leads)\(\) \{/);
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
      // For JSX text nodes (e.g., >إدارة العملاء (CRM)<)
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      content = content.replace(new RegExp('>' + escapedKey + '<', 'g'), '>' + value + '<');
    }
  }

  // Some missed special cases
  content = content.replace(/>وثائق العميل \(/g, ">{locale === 'ar' ? 'وثائق العميل (' : 'Client Policies ('}");
  content = content.replace(/>سجل التواصل \(/g, ">{locale === 'ar' ? 'سجل التواصل (' : 'Communication Log ('}");

  // Also replace inline properties that might be missed
  content = content.replace(/placeholder="ابحث بالاسم أو البريد أو الهاتف..."/g, "placeholder={locale === 'ar' ? 'ابحث بالاسم أو البريد أو الهاتف...' : 'Search by name, email, or phone...'}");
  content = content.replace(/placeholder="العنوان \*"/g, "placeholder={locale === 'ar' ? 'العنوان *' : 'Address *'}");
  content = content.replace(/placeholder="العنوان التفصيلي"/g, "placeholder={locale === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'}");
  content = content.replace(/placeholder="ملاحظات التواصل..."/g, "placeholder={locale === 'ar' ? 'ملاحظات التواصل...' : 'Communication Notes...'}");
  content = content.replace(/alt="الهوية الأمامية"/g, "alt={locale === 'ar' ? 'الهوية الأمامية' : 'Front ID'}");
  content = content.replace(/alt="الهوية الخلفية"/g, "alt={locale === 'ar' ? 'الهوية الخلفية' : 'Back ID'}");

  // Fix strings in conditional render inline
  content = content.replace(/ \? 'شركة' : 'فرد'/g, " ? (locale === 'ar' ? 'شركة' : 'Corporate') : (locale === 'ar' ? 'فرد' : 'Individual')");
  content = content.replace(/ \? 'شركات' : 'فردي'/g, " ? (locale === 'ar' ? 'شركات' : 'Corporate') : (locale === 'ar' ? 'فردي' : 'Individual')");
  content = content.replace(/ === 'LEAD' \? 'عميل محتمل \(Lead\)' : selectedClient\.status === 'ACTIVE' \? 'نشط' : 'غير نشط'/g, " === 'LEAD' ? (locale === 'ar' ? 'عميل محتمل (Lead)' : 'Lead') : selectedClient.status === 'ACTIVE' ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'غير نشط' : 'Inactive')");

  fs.writeFileSync(file, content, 'utf8');
  console.log('Translated ' + file);
});
