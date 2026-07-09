export interface Specialty {
  label: string;
  icon: string;
}

export interface SpecialtyCategory {
  name: string;
  icon: string;
  specialties: Specialty[];
}

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  {
    name: 'الحرف اليدوية',
    icon: '🔨',
    specialties: [
      { label: 'نجارة', icon: '🪵' },
      { label: 'حدادة', icon: '🔩' },
      { label: 'كهرباء', icon: '⚡' },
      { label: 'سباكة', icon: '🔧' },
      { label: 'دهان', icon: '🎨' },
      { label: 'ميكانيك سيارات', icon: '🚗' },
      { label: 'بناء', icon: '🧱' },
      { label: 'خياطة', icon: '🧵' },
      { label: 'لحام', icon: '🔥' },
      { label: 'بلاط وسيراميك', icon: '🏗️' },
      { label: 'زجاج', icon: '🪟' },
      { label: 'ألومنيوم', icon: '🪟' },
      { label: 'تكييف وتبريد', icon: '❄️' },
      { label: 'جبس وديكور', icon: '🏠' },
      { label: 'دباغة', icon: '🐂' },
      { label: 'حدادة فنية', icon: '⚒️' },
      { label: 'نقش وزخرفة', icon: '✨' },
      { label: 'صناعة الأثاث', icon: '🛋️' },
      { label: 'إصلاح أجهزة كهرومنزلية', icon: '🔌' },
      { label: 'سمكرة', icon: '🛠️' },
      { label: 'صناعة الأحذية', icon: '👞' },
      { label: 'صناعة الجلود', icon: '👜' },
      { label: 'حياكة', icon: '🧶' },
      { label: 'طرز وتطريز', icon: '🪡' },
      { label: 'صناعة الحلي والمجوهرات', icon: '💎' },
    ],
  },
  {
    name: 'التقنية والإعلام الآلي',
    icon: '💻',
    specialties: [
      { label: 'مطور ويب', icon: '🌐' },
      { label: 'مطور تطبيقات', icon: '📱' },
      { label: 'مبرمج', icon: '⌨️' },
      { label: 'مصمم جرافيك', icon: '🎨' },
      { label: 'مصمم مواقع', icon: '🖥️' },
      { label: 'تقنية معلومات', icon: '💻' },
      { label: 'شبكات وأنظمة', icon: '🌐' },
      { label: 'أمن معلوماتي', icon: '🔒' },
      { label: 'دعم تقني', icon: '🛠️' },
      { label: 'مصور فوتوغرافي', icon: '📷' },
      { label: 'مونتاج فيديو', icon: '🎬' },
      { label: 'يوتيوبر', icon: '📹' },
      { label: 'سوشيال ميديا', icon: '📱' },
    ],
  },
  {
    name: 'الصحة والطب',
    icon: '⚕️',
    specialties: [
      { label: 'طبيب عام', icon: '🩺' },
      { label: 'طبيب متخصص', icon: '👨‍⚕️' },
      { label: 'ممرض', icon: '💉' },
      { label: 'صيدلاني', icon: '💊' },
      { label: 'معالج فيزيائي', icon: '💪' },
      { label: 'طبيب أسنان', icon: '🦷' },
      { label: 'قابلة', icon: '👶' },
      { label: 'مختبر طبي', icon: '🔬' },
      { label: 'أشعة', icon: '📡' },
      { label: 'بصريات', icon: '👓' },
      { label: 'تغذية', icon: '🥗' },
    ],
  },
  {
    name: 'التعليم والتكوين',
    icon: '📚',
    specialties: [
      { label: 'أستاذ جامعي', icon: '🎓' },
      { label: 'أستاذ ثانوي', icon: '🏫' },
      { label: 'معلم ابتدائي', icon: '✏️' },
      { label: 'مدرس خصوصي', icon: '📖' },
      { label: 'مكون مهني', icon: '🛠️' },
      { label: 'مربي أطفال', icon: '🧸' },
      { label: 'مدير مدرسة', icon: '🏛️' },
    ],
  },
  {
    name: 'الإدارة والمال',
    icon: '📊',
    specialties: [
      { label: 'محاسب', icon: '📊' },
      { label: 'مدقق حسابات', icon: '📋' },
      { label: 'مدير إداري', icon: '👔' },
      { label: 'سكرتير', icon: '📝' },
      { label: 'موارد بشرية', icon: '👥' },
      { label: 'مستشار مالي', icon: '💰' },
      { label: 'إداري', icon: '🗂️' },
      { label: 'مكلف بالزبائن', icon: '🤝' },
      { label: 'مسير مؤسسة', icon: '🏢' },
    ],
  },
  {
    name: 'التجارة والتسويق',
    icon: '🛒',
    specialties: [
      { label: 'بائع', icon: '🛍️' },
      { label: 'مندوب مبيعات', icon: '📈' },
      { label: 'مسوق', icon: '📣' },
      { label: 'مستورد ومصدر', icon: '🚢' },
      { label: 'وكيل تجاري', icon: '🤝' },
      { label: 'مستشار تجاري', icon: '💼' },
    ],
  },
  {
    name: 'النقل والخدمات اللوجستية',
    icon: '🚚',
    specialties: [
      { label: 'سائق سيارة أجرة', icon: '🚕' },
      { label: 'سائق شاحنة', icon: '🚚' },
      { label: 'سائق حافلة', icon: '🚌' },
      { label: 'مسير مخزن', icon: '📦' },
      { label: 'عامل ميناء', icon: '⚓' },
      { label: 'موزع بضائع', icon: '🚲' },
    ],
  },
  {
    name: 'الأمن والحراسة',
    icon: '🛡️',
    specialties: [
      { label: 'حارس أمن', icon: '🛡️' },
      { label: 'مراقب', icon: '👁️' },
      { label: 'شرطي خاص', icon: '👮' },
      { label: 'مدير أمن', icon: '🎖️' },
    ],
  },
  {
    name: 'الفندقة والسياحة',
    icon: '🏨',
    specialties: [
      { label: 'طباخ', icon: '🍳' },
      { label: 'نادل', icon: '🍽️' },
      { label: 'مدير فندق', icon: '🏨' },
      { label: 'مرشد سياحي', icon: '🧭' },
      { label: 'حلواني', icon: '🍰' },
      { label: 'بائع مخبزة', icon: '🥖' },
    ],
  },
  {
    name: 'الحلاقة والتجميل',
    icon: '💈',
    specialties: [
      { label: 'حلاق رجالي', icon: '💈' },
      { label: 'حلاقة نسائية', icon: '💇‍♀️' },
      { label: 'تجميل أظافر', icon: '💅' },
      { label: 'مكياج', icon: '💄' },
      { label: 'تدليك', icon: '💆' },
    ],
  },
  {
    name: 'الفلاحة والبيئة',
    icon: '🌾',
    specialties: [
      { label: 'فلاح', icon: '🌾' },
      { label: 'بستاني', icon: '🌱' },
      { label: 'مربي مواشي', icon: '🐄' },
      { label: 'صياد', icon: '🎣' },
      { label: 'تقني زراعي', icon: '🚜' },
      { label: 'غابات وبيئة', icon: '🌳' },
      { label: 'مربي نحل', icon: '🐝' },
      { label: 'زراعة مائية', icon: '💧' },
    ],
  },
  {
    name: 'الهندسة',
    icon: '📐',
    specialties: [
      { label: 'مهندس مدني', icon: '🏗️' },
      { label: 'مهندس معماري', icon: '🏛️' },
      { label: 'مهندس ميكانيكي', icon: '⚙️' },
      { label: 'مهندس كهربائي', icon: '⚡' },
      { label: 'مهندس زراعي', icon: '🌾' },
      { label: 'مهندس بيئة', icon: '🌍' },
      { label: 'مهندس صناعي', icon: '🏭' },
      { label: 'مساح أراضي', icon: '📐' },
      { label: 'مهندس تقنية معلومات', icon: '💻' },
    ],
  },
  {
    name: 'القانون والإعلام',
    icon: '⚖️',
    specialties: [
      { label: 'محامي', icon: '⚖️' },
      { label: 'موثق', icon: '📜' },
      { label: 'مستشار قانوني', icon: '📋' },
      { label: 'صحفي', icon: '📰' },
      { label: 'مذيع', icon: '🎙️' },
      { label: 'مترجم', icon: '🌐' },
      { label: 'كاتب محكمة', icon: '✍️' },
    ],
  },
  {
    name: 'الفن والإبداع',
    icon: '🎨',
    specialties: [
      { label: 'رسام', icon: '🎨' },
      { label: 'موسيقي', icon: '🎵' },
      { label: 'ممثل', icon: '🎭' },
      { label: 'مصمم أزياء', icon: '👗' },
      { label: 'كاتب', icon: '✍️' },
      { label: 'شاعر', icon: '📜' },
      { label: 'خطاط', icon: '🖌️' },
    ],
  },
  {
    name: 'الرياضة واللياقة',
    icon: '⚽',
    specialties: [
      { label: 'مدرب رياضي', icon: '🏋️' },
      { label: 'لاعب محترف', icon: '⚽' },
      { label: 'مدرب لياقة بدنية', icon: '💪' },
      { label: 'حكم رياضي', icon: '🦮' },
    ],
  },
  {
    name: 'الدين والإرشاد',
    icon: '🕌',
    specialties: [
      { label: 'إمام', icon: '🕌' },
      { label: 'مرشد ديني', icon: '📖' },
      { label: 'أستاذ قرآن كريم', icon: '📚' },
    ],
  },
  {
    name: 'الصناعة',
    icon: '🏭',
    specialties: [
      { label: 'عامل مصنع', icon: '🏭' },
      { label: 'تقني إنتاج', icon: '⚙️' },
      { label: 'مراقب جودة', icon: '✅' },
      { label: 'ميكانيكي صناعي', icon: '🔧' },
      { label: 'كيميائي', icon: '🧪' },
    ],
  },
];

export const ALL_SPECIALTIES: Specialty[] = SPECIALTY_CATEGORIES.flatMap(
  (c) => c.specialties
);

export const ALL_SPECIALTY_LABELS: string[] = ALL_SPECIALTIES.map((s) => s.label);
