export type SpecialtyCategory = {
  name: string;
  icon: string;
  gradient: string;
  lightBg: string;
  textColor: string;
  border: string;
  specialties: string[];
};

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  {
    name: 'الحرف اليدوية',
    icon: '🔨',
    gradient: 'from-orange-500 to-red-600',
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-700',
    border: 'border-orange-200',
    specialties: [
      'نجارة', 'حدادة', 'كهرباء', 'سباكة', 'دهان', 'ميكانيك سيارات',
      'بناء', 'خياطة', 'لحام', 'بلاط وسيراميك', 'زجاج', 'ألومنيوم',
      'تكييف وتبريد', 'جبس وديكور', 'دباغة', 'حدادة فنية', 'نقش وزخرفة',
      'صناعة الأثاث', 'إصلاح أجهزة كهرومنزلية', 'سمكرة', 'صناعة الأحذية',
      'صناعة الجلود', 'حياكة', 'طرز وتطريز', 'صناعة الحلي والمجوهرات',
    ],
  },
  {
    name: 'التقنية والإعلام الآلي',
    icon: '💻',
    gradient: 'from-blue-500 to-cyan-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
    border: 'border-blue-200',
    specialties: [
      'مطور ويب', 'مطور تطبيقات', 'مبرمج', 'مصمم جرافيك', 'مصمم مواقع',
      'تقنية معلومات', 'شبكات وأنظمة', 'أمن معلوماتي', 'دعم تقني',
      'مصور فوتوغرافي', 'مونتاج فيديو', 'يوتيوبر', 'سوشيال ميديا',
    ],
  },
  {
    name: 'الصحة والطب',
    icon: '🏥',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    border: 'border-rose-200',
    specialties: [
      'طبيب عام', 'طبيب متخصص', 'ممرض', 'صيدلاني', 'معالج فيزيائي',
      'طبيب أسنان', 'قابلة', 'مختبر طبي', 'أشعة', 'بصريات', 'تغذية',
    ],
  },
  {
    name: 'التعليم والتكوين',
    icon: '📚',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    border: 'border-emerald-200',
    specialties: [
      'أستاذ جامعي', 'أستاذ ثانوي', 'معلم ابتدائي', 'مدرس خصوصي',
      'مكون مهني', 'مربي أطفال', 'مدير مدرسة',
    ],
  },
  {
    name: 'الإدارة والمال',
    icon: '💼',
    gradient: 'from-slate-500 to-gray-700',
    lightBg: 'bg-slate-50',
    textColor: 'text-slate-700',
    border: 'border-slate-200',
    specialties: [
      'محاسب', 'مدقق حسابات', 'مدير إداري', 'سكرتير', 'موارد بشرية',
      'مستشار مالي', 'إداري', 'مكلف بالزبائن', 'مسير مؤسسة',
    ],
  },
  {
    name: 'التجارة والتسويق',
    icon: '🛒',
    gradient: 'from-amber-500 to-yellow-600',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    border: 'border-amber-200',
    specialties: [
      'بائع', 'مندوب مبيعات', 'مسوق', 'مستورد ومصدر',
      'وكيل تجاري', 'مستشار تجاري',
    ],
  },
  {
    name: 'النقل واللوجستيك',
    icon: '🚚',
    gradient: 'from-sky-500 to-blue-700',
    lightBg: 'bg-sky-50',
    textColor: 'text-sky-700',
    border: 'border-sky-200',
    specialties: [
      'سائق سيارة أجرة', 'سائق شاحنة', 'سائق حافلة',
      'مسير مخزن', 'عامل ميناء', 'موزع بضائع',
    ],
  },
  {
    name: 'الأمن والحراسة',
    icon: '🛡️',
    gradient: 'from-zinc-600 to-gray-800',
    lightBg: 'bg-zinc-50',
    textColor: 'text-zinc-700',
    border: 'border-zinc-200',
    specialties: ['حارس أمن', 'مراقب', 'شرطي خاص', 'مدير أمن'],
  },
  {
    name: 'الفندقة والسياحة',
    icon: '🍽️',
    gradient: 'from-red-500 to-orange-600',
    lightBg: 'bg-red-50',
    textColor: 'text-red-700',
    border: 'border-red-200',
    specialties: [
      'طباخ', 'نادل', 'مدير فندق', 'مرشد سياحي',
      'حلواني', 'بائع مخبزة',
    ],
  },
  {
    name: 'الحلاقة والتجميل',
    icon: '✨',
    gradient: 'from-fuchsia-500 to-purple-600',
    lightBg: 'bg-fuchsia-50',
    textColor: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    specialties: [
      'حلاق رجالي', 'حلاقة نسائية', 'تجميل أظافر', 'مكياج', 'تدليك',
    ],
  },
  {
    name: 'الفلاحة والبيئة',
    icon: '🌿',
    gradient: 'from-green-500 to-lime-600',
    lightBg: 'bg-green-50',
    textColor: 'text-green-700',
    border: 'border-green-200',
    specialties: [
      'فلاح', 'بستاني', 'مربي مواشي', 'صياد', 'تقني زراعي',
      'غابات وبيئة', 'مربي نحل', 'زراعة مائية',
    ],
  },
  {
    name: 'الهندسة',
    icon: '⚙️',
    gradient: 'from-indigo-500 to-blue-700',
    lightBg: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    border: 'border-indigo-200',
    specialties: [
      'مهندس مدني', 'مهندس معماري', 'مهندس ميكانيكي', 'مهندس كهربائي',
      'مهندس زراعي', 'مهندس بيئة', 'مهندس صناعي', 'مساح أراضي',
      'مهندس تقنية معلومات',
    ],
  },
  {
    name: 'القانون والإعلام',
    icon: '⚖️',
    gradient: 'from-stone-500 to-gray-700',
    lightBg: 'bg-stone-50',
    textColor: 'text-stone-700',
    border: 'border-stone-200',
    specialties: [
      'محامي', 'موثق', 'مستشار قانوني', 'صحفي', 'مذيع',
      'مترجم', 'كاتب محكمة',
    ],
  },
  {
    name: 'الفن والإبداع',
    icon: '🎨',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-700',
    border: 'border-violet-200',
    specialties: [
      'رسام', 'موسيقي', 'ممثل', 'مصمم أزياء', 'كاتب', 'شاعر', 'خطاط',
    ],
  },
  {
    name: 'الرياضة واللياقة',
    icon: '⚽',
    gradient: 'from-teal-500 to-emerald-600',
    lightBg: 'bg-teal-50',
    textColor: 'text-teal-700',
    border: 'border-teal-200',
    specialties: [
      'مدرب رياضي', 'لاعب محترف', 'مدرب لياقة بدنية', 'حكم رياضي',
    ],
  },
  {
    name: 'الدين والإرشاد',
    icon: '☪️',
    gradient: 'from-green-600 to-teal-700',
    lightBg: 'bg-green-50',
    textColor: 'text-green-800',
    border: 'border-green-300',
    specialties: ['إمام', 'مرشد ديني', 'أستاذ قرآن كريم'],
  },
  {
    name: 'الصناعة',
    icon: '🏭',
    gradient: 'from-gray-600 to-slate-800',
    lightBg: 'bg-gray-50',
    textColor: 'text-gray-700',
    border: 'border-gray-200',
    specialties: [
      'عامل مصنع', 'تقني إنتاج', 'مراقب جودة',
      'ميكانيكي صناعي', 'كيميائي',
    ],
  },
];

export const SPECIALTIES: string[] = SPECIALTY_CATEGORIES.flatMap(c => c.specialties);
