export type AppLanguage = 'my' | 'en';

export interface Translations {
  tabs: {
    events: string;
    fines: string;
    roster: string;
    reports: string;
    settings: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    search: string;
    filter: string;
    all: string;
    paid: string;
    unpaid: string;
    status: string;
    date: string;
    amount: string;
    close: string;
    back: string;
    loading: string;
    active: string;
    offline: string;
    total: string;
    success: string;
    error: string;
    actions: string;
    export: string;
    download: string;
    copy: string;
    share: string;
    preview: string;
    options: string;
    details: string;
    note: string;
    optional: string;
    confirm: string;
    reset: string;
    name: string;
    phone: string;
    sync: string;
    done: string;
  };
  events: {
    title: string;
    subtitle: string;
    totalCollected: string;
    eventsCount: (count: number) => string;
    donation: string;
    fixedFee: string;
    perStudent: string;
    dueDate: string;
    newEvent: string;
    emptyTitle: string;
    emptyDesc: string;
    createTitle: string;
    createButton: string;
    nameLabel: string;
    namePlaceholder: string;
    typeLabel: string;
    fixedAmountLabel: string;
    dueDateLabel: string;
    noteLabel: string;
    notePlaceholder: string;
    collected: string;
    donorsCount: (count: number) => string;
    paidCount: (count: number) => string;
    filterAll: (count: number) => string;
    filterDonation: (count: number) => string;
    filterFixed: (count: number) => string;
    donorsList: string;
    collectionRoster: string;
    addDonor: string;
    addDonorSub: string;
    donorAmount: string;
    selectDonor: string;
    searchDonors: string;
    searchEvents: string;
    initialNotice: string;
    finalReport: string;
    noticeCopied: string;
    finalCopied: string;
    deleteConfirmTitle: string;
    deleteConfirmMsg: (name: string) => string;
    eventCreatedToast: string;
    eventDeletedToast: string;
    donorAddedToast: string;
    amountPaidTotal: string;
  };
  fines: {
    title: string;
    subtitle: string;
    summaryTitle: string;
    totalAll: string;
    paidTotal: string;
    unpaidTotal: string;
    allSubjects: string;
    allStatus: string;
    searchPlaceholder: string;
    batchFine: string;
    imageExport: string;
    emptyTitle: string;
    emptyDesc: string;
    deleteTitle: string;
    deleteMsg: (name: string) => string;
    deleteToast: string;
    markPaidToast: string;
    markUnpaidToast: string;
    reason: string;
    history: string;
    countFines: (count: number) => string;
    batchCountToast: (count: number) => string;
  };
  roster: {
    title: string;
    subtitle: string;
    studentsTab: (count: number) => string;
    subjectsTab: (count: number) => string;
    searchStudents: string;
    searchSubjects: string;
    addStudent: string;
    addSubject: string;
    emptyStudentsTitle: string;
    emptyStudentsDesc: string;
    emptySubjectsTitle: string;
    emptySubjectsDesc: string;
    unpaidDues: string;
    allClear: string;
    deleteStudentTitle: string;
    deleteStudentMsg: (name: string) => string;
    deleteStudentToast: string;
    deleteSubjectTitle: string;
    deleteSubjectMsg: (name: string) => string;
    deleteSubjectToast: string;
    studentCount: (count: number) => string;
    rollNumber: string;
    noRoll: string;
    noPhone: string;
  };
  reports: {
    title: string;
    subtitle: string;
    financialStatus: string;
    paidFines: string;
    unpaidFines: string;
    subjectBreakdown: string;
    studentDues: string;
    exportCSV: string;
    exportJSON: string;
    imageExport: string;
    noDuesTitle: string;
    noDuesDesc: string;
    noSubjects: string;
    finesSummary: string;
    rank: string;
    subject: string;
    student: string;
    unpaidCount: (count: number) => string;
    totalFinesCount: (count: number) => string;
    csvSuccess: string;
    jsonSuccess: string;
    clipboardSuccess: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageSub: string;
    english: string;
    burmese: string;
    appearance: string;
    appearanceSub: string;
    currentColor: string;
    presets: string;
    cloudSync: string;
    cloudSyncSub: string;
    connected: string;
    offlineMode: string;
    connectedAccount: string;
    lastSync: (time: string) => string;
    syncNow: string;
    syncSuccess: string;
    syncError: string;
    manageCloud: string;
    enableCloud: string;
    kbzPay: string;
    kbzPaySub: string;
    accountName: string;
    accountNamePlaceholder: string;
    phoneNumber: string;
    phoneNumberPlaceholder: string;
    saveKbz: string;
    kbzSavedToast: string;
    dataBackup: string;
    dataBackupSub: string;
    dangerZone: string;
    dangerZoneSub: string;
    resetAllData: string;
    resetConfirmTitle: string;
    resetConfirmMsg: string;
    resetSuccessToast: string;
    themeChangedToast: string;
  };
  modals: {
    addStudent: {
      titleAdd: string;
      titleEdit: string;
      nameLabel: string;
      namePlaceholder: string;
      rollLabel: string;
      rollPlaceholder: string;
      phoneLabel: string;
      phonePlaceholder: string;
      submitAdd: string;
      submitEdit: string;
      errorRequired: string;
    };
    addSubject: {
      titleAdd: string;
      titleEdit: string;
      nameLabel: string;
      namePlaceholder: string;
      submitAdd: string;
      submitEdit: string;
      errorRequired: string;
    };
    batchFine: {
      title: string;
      subtitle: string;
      dateLabel: string;
      subjectLabel: string;
      newSubjectInline: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      amountLabel: string;
      quickAmounts: string;
      selectStudentsLabel: string;
      searchStudentPlaceholder: string;
      selectAll: string;
      selectedCount: (selected: number, total: number) => string;
      totalFinePreview: (amount: string) => string;
      submit: string;
      errorSelectSubject: string;
      errorReason: string;
      errorAmount: string;
      errorNoStudent: string;
    };
    createEvent: {
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      typeLabel: string;
      fixedAmountLabel: string;
      dueDateLabel: string;
      dueDatePlaceholder: string;
      noteLabel: string;
      notePlaceholder: string;
      submit: string;
      errorName: string;
      errorAmount: string;
    };
    eventDetail: {
      tabDetails: string;
      tabDonors: string;
      perStudentRate: string;
      announcements: string;
      initialNotice: string;
      finalNotice: string;
      noticeTip: string;
      deleteEvent: string;
      addDonorTitle: string;
      donorStudentLabel: string;
      donorAmountLabel: string;
      submitDonor: string;
      errorSelectStudent: string;
      paidFilterAll: string;
      paidFilterPaid: string;
      paidFilterUnpaid: string;
    };
    aesthetic: {
      title: string;
      subtitle: string;
      previewTab: string;
      optionsTab: string;
      layoutDual: string;
      layoutTable: string;
      sourceStudentFines: string;
      sourceSubjectFines: string;
      sourceEventDonors: string;
      sourceFinesLedger: string;
      filterAll: string;
      filterWithFines: string;
      filterUnpaid: string;
      filterPaid: string;
      downloadPNG: string;
      shareImage: string;
      copyImage: string;
      exporting: string;
    };
  };
}

export const translations: Record<AppLanguage, Translations> = {
  my: {
    tabs: {
      events: 'အခမ်းအနား',
      fines: 'ဒဏ်ကြေး',
      roster: 'ကျောင်းသား',
      reports: 'အစီရင်ခံစာ',
      settings: 'ဆက်တင်',
    },
    common: {
      save: 'သိမ်းမည်',
      cancel: 'မလုပ်တော့ပါ',
      delete: 'ဖျက်မည်',
      edit: 'ပြင်မည်',
      add: 'ထည့်မည်',
      remove: 'ပယ်ဖျက်မည်',
      search: 'ရှာရန်...',
      filter: 'စစ်ထုတ်ရန်',
      all: 'အားလုံး',
      paid: 'ပေးပြီး',
      unpaid: 'မပေးရသေး',
      status: 'အခြေအနေ',
      date: 'ရက်စွဲ',
      amount: 'ပမာဏ',
      close: 'ပိတ်မည်',
      back: 'နောက်သို့',
      loading: 'လုပ်ဆောင်နေသည်...',
      active: 'ချိတ်ဆက်ထားသည်',
      offline: 'အော့ဖ်လိုင်း',
      total: 'စုစုပေါင်း',
      success: 'အောင်မြင်ပါသည်',
      error: 'အမှားဖြစ်ပေါ်ပါသည်',
      actions: 'လုပ်ဆောင်ချက်များ',
      export: 'ထုတ်ယူမည်',
      download: 'ဒေါင်းလုဒ်',
      copy: 'ကူးယူမည်',
      share: 'မျှဝေမည်',
      preview: 'အစမ်းကြည့်',
      options: 'ဆက်တင်များ',
      details: 'အသေးစိတ်',
      note: 'မှတ်ချက်',
      optional: 'ရွေးချယ်ရန်',
      confirm: 'အတည်ပြုမည်',
      reset: 'ပြန်လည်သတ်မှတ်မည်',
      name: 'အမည်',
      phone: 'ဖုန်းနံပါတ်',
      sync: 'Sync ပြုလုပ်မည်',
      done: 'ပြီးပါပြီ',
    },
    events: {
      title: 'အခမ်းအနားများ',
      subtitle: 'အလှူငွေနှင့် ရန်ပုံငွေ ကောက်ခံမှုများ',
      totalCollected: 'စုစုပေါင်း ရရှိငွေ',
      eventsCount: (count) => `${count} ခု ရှိပါသည်`,
      donation: 'စေတနာအလှူ',
      fixedFee: 'သတ်မှတ်ကြေး',
      perStudent: 'တစ်ဦးလျှင် နှုန်းထား',
      dueDate: 'နောက်ဆုံးရက်',
      newEvent: 'အသစ်ဖန်တီးမည်',
      emptyTitle: 'အခမ်းအနား မှတ်တမ်း မရှိသေးပါ',
      emptyDesc: 'အလှူငွေ သို့မဟုတ် အတန်းရန်ပုံငွေအတွက် အသစ်စတင်ရန် နှိပ်ပါ',
      createTitle: 'အခမ်းအနား အသစ်ဖန်တီးရန်',
      createButton: 'အခမ်းအနား ဖန်တီးမည်',
      nameLabel: 'အခမ်းအနား အမည်',
      namePlaceholder: 'ဥပမာ - ဆရာကန်တော့ပွဲ၊ ကထိန်၊ အခန်းရန်ပုံငွေ',
      typeLabel: 'ကောက်ခံမှု အမျိုးအစား',
      fixedAmountLabel: 'တစ်ဦးလျှင် ပေးသွင်းရမည့်နှုန်း',
      dueDateLabel: 'နောက်ဆုံး ပေးသွင်းရမည့်ရက်',
      noteLabel: 'အချက်အလက် / မှတ်ချက်',
      notePlaceholder: 'လိုအပ်သော အချက်အလက်များ...',
      collected: 'ကောက်ခံရရှိငွေ',
      donorsCount: (count) => `${count} ဦး လှူဒါန်းပြီး`,
      paidCount: (count) => `${count} ဦး ပေးသွင်းပြီး`,
      filterAll: (count) => `အားလုံး (${count})`,
      filterDonation: (count) => `စေတနာအလှူ (${count})`,
      filterFixed: (count) => `သတ်မှတ်ကြေး (${count})`,
      donorsList: 'အလှူရှင် စာရင်း',
      collectionRoster: 'ပေးသွင်းမှု စာရင်း',
      addDonor: 'အလှူရှင် ထည့်မည်',
      addDonorSub: 'အလှူငွေ ထည့်သွင်းမှတ်တမ်းတင်ရန်',
      donorAmount: 'အလှူငွေ ပမာဏ',
      selectDonor: 'လှူဒါန်းသူ ကျောင်းသား ရွေးပါ',
      searchDonors: 'အလှူရှင် ရှာရန်...',
      searchEvents: 'အခမ်းအနား ရှာရန်...',
      initialNotice: 'အစောပိုင်း ကြေညာချက်',
      finalReport: 'စာရင်းပိတ် ကြေညာချက်',
      noticeCopied: 'အစောပိုင်း ကြေညာချက် ကူးယူပြီးပါပြီ',
      finalCopied: 'စာရင်းပိတ် ကြေညာချက် ကူးယူပြီးပါပြီ',
      deleteConfirmTitle: 'အခမ်းအနား ဖျက်မည်',
      deleteConfirmMsg: (name) => `"${name}" နှင့် ဆက်စပ်မှတ်တမ်းအားလုံးကို ဖျက်ရန် သေချာပါသလား?`,
      eventCreatedToast: 'အခမ်းအနား အသစ် ဖန်တီးပြီးပါပြီ',
      eventDeletedToast: 'အခမ်းအနားကို ဖျက်ပစ်လိုက်ပါပြီ',
      donorAddedToast: 'အလှူရှင် မှတ်တမ်းတင်ပြီးပါပြီ',
      amountPaidTotal: 'ပေးသွင်းပြီး စုစုပေါင်း',
    },
    fines: {
      title: 'ဒဏ်ကြေးများ',
      subtitle: 'ဘာသာရပ်အလိုက် ပျက်ကွက် ဒဏ်ကြေးများ',
      summaryTitle: 'ဒဏ်ကြေး စာရင်းချုပ်',
      totalAll: 'ဒဏ်ကြေး စုစုပေါင်း',
      paidTotal: 'ရရှိပြီး',
      unpaidTotal: 'ပေးရန်ကျန်',
      allSubjects: 'ဘာသာရပ် အားလုံး',
      allStatus: 'အားလုံး',
      searchPlaceholder: 'ကျောင်းသား သို့မဟုတ် အကြောင်းပြချက် ရှာရန်...',
      batchFine: 'ဒဏ်ကြေးချမှတ်မည်',
      imageExport: 'ပုံထုတ်ယူမည်',
      emptyTitle: 'ဒဏ်ကြေး မှတ်တမ်း မရှိပါ',
      emptyDesc: 'ကျောင်းသားများအတွက် ဒဏ်ကြေး အသစ်ချမှတ်ရန် အောက်ပါခလုတ်ကို နှိပ်ပါ',
      deleteTitle: 'ဒဏ်ကြေး ဖျက်မည်',
      deleteMsg: (name) => `"${name}" ၏ ဒဏ်ကြေးမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?`,
      deleteToast: 'ဒဏ်ကြေးမှတ်တမ်းကို ဖျက်ပြီးပါပြီ',
      markPaidToast: 'ဒဏ်ကြေး ပေးချေပြီးကြောင်း မှတ်သားလိုက်ပါပြီ',
      markUnpaidToast: 'ဒဏ်ကြေး မပေးရသေးကြောင်း ပြောင်းလဲလိုက်ပါပြီ',
      reason: 'အကြောင်းပြချက်',
      history: 'ဒဏ်ကြေး မှတ်တမ်းများ',
      countFines: (count) => `${count} ကြိမ်`,
      batchCountToast: (count) => `ကျောင်းသား ${count} ဦးအတွက် ဒဏ်ကြေး ချမှတ်ပြီးပါပြီ`,
    },
    roster: {
      title: 'ကျောင်းသား & ဘာသာရပ်',
      subtitle: 'ကျောင်းသားစာရင်းနှင့် ဘာသာရပ် စီမံခန့်ခွဲမှု',
      studentsTab: (count) => `ကျောင်းသား (${count})`,
      subjectsTab: (count) => `ဘာသာရပ် (${count})`,
      searchStudents: 'အမည် သို့မဟုတ် ခုံနံပါတ်ဖြင့် ရှာရန်...',
      searchSubjects: 'ဘာသာရပ် အမည်ဖြင့် ရှာရန်...',
      addStudent: 'ကျောင်းသား အသစ်',
      addSubject: 'ဘာသာရပ် အသစ်',
      emptyStudentsTitle: 'ကျောင်းသားစာရင်း မရှိသေးပါ',
      emptyStudentsDesc: 'အတန်းတွင်း ကျောင်းသားများ စတင်ထည့်သွင်းရန် နှိပ်ပါ',
      emptySubjectsTitle: 'ဘာသာရပ် မရှိသေးပါ',
      emptySubjectsDesc: 'သင်ကြားသည့် ဘာသာရပ်များ ထည့်သွင်းရန် နှိပ်ပါ',
      unpaidDues: 'ဒဏ်ကြေး ပေးရန်ရှိ',
      allClear: 'အားလုံး ရှင်းပြီး',
      deleteStudentTitle: 'ကျောင်းသား ဖျက်မည်',
      deleteStudentMsg: (name) => `"${name}" အား ကျောင်းသားစာရင်းမှ ဖျက်ရန် သေချာပါသလား?`,
      deleteStudentToast: 'ကျောင်းသားစာရင်းမှ ဖျက်ပစ်လိုက်ပါပြီ',
      deleteSubjectTitle: 'ဘာသာရပ် ဖျက်မည်',
      deleteSubjectMsg: (name) => `"${name}" ဘာသာရပ်ကို ဖျက်ရန် သေချာပါသလား?`,
      deleteSubjectToast: 'ဘာသာရပ်ကို ဖျက်ပစ်လိုက်ပါပြီ',
      studentCount: (count) => `${count} ဦး`,
      rollNumber: 'ခုံနံပါတ်',
      noRoll: 'ခုံနံပါတ်မရှိ',
      noPhone: 'ဖုန်းမရှိ',
    },
    reports: {
      title: 'အစီရင်ခံစာများ',
      subtitle: 'ဘဏ္ဍာရေး စာရင်းချုပ်နှင့် ထုတ်ယူမှုများ',
      financialStatus: 'ဘဏ္ဍာရေး အခြေအနေ',
      paidFines: 'ကောက်ခံရရှိပြီး',
      unpaidFines: 'ပေးရန်ကျန်ရှိငွေ',
      subjectBreakdown: 'ဘာသာရပ်အလိုက် စာရင်း',
      studentDues: 'ပေးရန်ကျန် ကျောင်းသားများ',
      exportCSV: 'CSV ထုတ်ယူမည်',
      exportJSON: 'JSON Backup',
      imageExport: 'ပုံအဖြစ် ထုတ်ယူမည်',
      noDuesTitle: 'ပေးရန်ကျန် မရှိပါ',
      noDuesDesc: 'ကျောင်းသားအားလုံး ဒဏ်ကြေးပေးဆောင်ပြီးပါပြီ',
      noSubjects: 'ဘာသာရပ် မှတ်တမ်း မရှိသေးပါ',
      finesSummary: 'ဒဏ်ကြေး စာရင်းချုပ်',
      rank: 'အဆင့်',
      subject: 'ဘာသာရပ်',
      student: 'ကျောင်းသား',
      unpaidCount: (count) => `${count} ကြိမ် မပေးရသေး`,
      totalFinesCount: (count) => `${count} ကြိမ်`,
      csvSuccess: 'CSV ဖိုင် ထုတ်ယူပြီးပါပြီ',
      jsonSuccess: 'JSON Backup ထုတ်ယူပြီးပါပြီ',
      clipboardSuccess: 'Clipboard သို့ ကူးယူပြီးပါပြီ',
    },
    settings: {
      title: 'ဆက်တင်များ',
      subtitle: 'အသွင်အပြင်နှင့် စနစ် ဆက်တင်များ',
      language: 'ဘာသာစကား',
      languageSub: 'အသုံးပြုလိုသည့် ဘာသာစကား ရွေးချယ်ပါ',
      english: 'English',
      burmese: 'မြန်မာ',
      appearance: 'အသွင်အပြင်',
      appearanceSub: 'စနစ်အတွက် Theme အရောင် ရွေးချယ်ရန်',
      currentColor: 'လက်ရှိ အရောင်',
      presets: 'အသင့်သုံး အရောင်များ',
      cloudSync: 'Cloud Sync',
      cloudSyncSub: 'စက်ပစ္စည်းများအကြား အလိုအလျောက် ချိတ်ဆက်မှု',
      connected: 'ချိတ်ဆက်ထားသည်',
      offlineMode: 'အော့ဖ်လိုင်း',
      connectedAccount: 'ချိတ်ဆက်ထားသော အကောင့်',
      lastSync: (time) => `နောက်ဆုံး Sync: ${time}`,
      syncNow: 'Sync လုပ်မည်',
      syncSuccess: 'Cloud Sync အောင်မြင်ပါသည်',
      syncError: 'Sync ပြုလုပ်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်',
      manageCloud: 'Cloud Sync စီမံမည်',
      enableCloud: 'Cloud Sync ဖွင့်မည်',
      kbzPay: 'ငွေလွှဲ အချက်အလက်များ',
      kbzPaySub: 'ကြေညာချက်များတွင် ဖော်ပြပေးမည့် KBZPay အချက်အလက်',
      accountName: 'KBZPay အကောင့်အမည်',
      accountNamePlaceholder: 'ဥပမာ - Kaung Sat Oo',
      phoneNumber: 'KBZPay ဖုန်းနံပါတ်',
      phoneNumberPlaceholder: 'ဥပမာ - 09447131200',
      saveKbz: 'သိမ်းဆည်းမည်',
      kbzSavedToast: 'KBZPay အချက်အလက်များ သိမ်းဆည်းပြီးပါပြီ',
      dataBackup: 'ဒေတာ Backup',
      dataBackupSub: 'ဒေတာများကို သိမ်းဆည်းခြင်းနှင့် ထုတ်ယူခြင်း',
      dangerZone: 'အချက်အလက် ရှင်းလင်းခြင်း',
      dangerZoneSub: 'မှတ်တမ်းအားလုံးကို မူလအတိုင်း ပြန်လည်သတ်မှတ်မည်',
      resetAllData: 'ဒေတာအားလုံး ရှင်းလင်းမည်',
      resetConfirmTitle: 'ဒေတာအားလုံး အသစ်ပြန်သတ်မှတ်မည်',
      resetConfirmMsg: 'ကျောင်းသားများ၊ ဒဏ်ကြေးများနှင့် အခမ်းအနားအားလုံးကို ဖျက်ရန် သေချာပါသလား?',
      resetSuccessToast: 'ဒေတာအားလုံး ရှင်းလင်းပြီး စနစ်အသစ် စတင်ပါပြီ',
      themeChangedToast: 'Theme အရောင် ပြောင်းလဲပြီးပါပြီ',
    },
    modals: {
      addStudent: {
        titleAdd: 'ကျောင်းသား အသစ်ထည့်ရန်',
        titleEdit: 'ကျောင်းသား အချက်အလက်ပြင်ရန်',
        nameLabel: 'ကျောင်းသား အမည်',
        namePlaceholder: 'ဥပမာ - Aung Kaung Myat',
        rollLabel: 'ခုံနံပါတ်',
        rollPlaceholder: 'ဥပမာ - 3CS-14 သို့မဟုတ် 12',
        phoneLabel: 'ဖုန်းနံပါတ်',
        phonePlaceholder: 'ဥပမာ - 09447131200',
        submitAdd: 'ကျောင်းသား ထည့်မည်',
        submitEdit: 'သိမ်းဆည်းမည်',
        errorRequired: 'ကျောင်းသားအမည် ထည့်သွင်းပေးပါရန်',
      },
      addSubject: {
        titleAdd: 'ဘာသာရပ် အသစ်ထည့်ရန်',
        titleEdit: 'ဘာသာရပ် အချက်အလက်ပြင်ရန်',
        nameLabel: 'ဘာသာရပ် အမည်',
        namePlaceholder: 'ဥပမာ - Data Structures, AI, Java',
        submitAdd: 'ဘာသာရပ် ထည့်မည်',
        submitEdit: 'သိမ်းဆည်းမည်',
        errorRequired: 'ဘာသာရပ်အမည် ထည့်သွင်းပေးပါရန်',
      },
      batchFine: {
        title: 'ဒဏ်ကြေး ချမှတ်ရန်',
        subtitle: 'ကျောင်းသားများအတွက် ဒဏ်ကြေး တစ်ပြိုင်နက် သတ်မှတ်ခြင်း',
        dateLabel: 'ရက်စွဲ',
        subjectLabel: 'ဘာသာရပ်',
        newSubjectInline: 'ဘာသာရပ် အသစ်ထည့်ရန်',
        reasonLabel: 'အကြောင်းပြချက်',
        reasonPlaceholder: 'ဥပမာ - အတန်းနောက်ကျခြင်း၊ အိမ်စာမတင်ခြင်း',
        amountLabel: 'ဒဏ်ကြေး ပမာဏ',
        quickAmounts: 'အသင့်သုံး ပမာဏများ',
        selectStudentsLabel: 'ကျောင်းသားများ ရွေးချယ်ရန်',
        searchStudentPlaceholder: 'ကျောင်းသား ရှာရန်...',
        selectAll: 'အားလုံး ရွေးမည်',
        selectedCount: (selected, total) => `${selected} / ${total} ဦး ရွေးထားသည်`,
        totalFinePreview: (amount) => `စုစုပေါင်း ဒဏ်ကြေး: ${amount}`,
        submit: 'ဒဏ်ကြေး ချမှတ်မည်',
        errorSelectSubject: 'ဘာသာရပ်တစ်ခု ရွေးချယ်ပေးပါ',
        errorReason: 'ဒဏ်ကြေး အကြောင်းပြချက် ရိုက်ထည့်ပါ',
        errorAmount: 'ဒဏ်ကြေးပမာဏ ထည့်သွင်းပေးပါ',
        errorNoStudent: 'အနည်းဆုံး ကျောင်းသား ၁ ဦး ရွေးချယ်ပါ',
      },
      createEvent: {
        title: 'အခမ်းအနား အသစ်ဖန်တီးရန်',
        nameLabel: 'အခမ်းအနား အမည်',
        namePlaceholder: 'ဥပမာ - ဆရာကန်တော့ပွဲ၊ ကထိန်၊ အခန်းရန်ပုံငွေ',
        typeLabel: 'အမျိုးအစား ရွေးချယ်ရန်',
        fixedAmountLabel: 'တစ်ဦးလျှင် သတ်မှတ်နှုန်း',
        dueDateLabel: 'နောက်ဆုံး ပေးသွင်းရမည့်ရက်',
        dueDatePlaceholder: 'DD/MM/YY',
        noteLabel: 'အချက်အလက် / မှတ်ချက်',
        notePlaceholder: 'လိုအပ်သော အချက်အလက်များ...',
        submit: 'အခမ်းအနား ဖန်တီးမည်',
        errorName: 'အခမ်းအနား အမည် ထည့်သွင်းပေးပါ',
        errorAmount: 'သတ်မှတ်ကြေးပမာဏ အနည်းဆုံး ၁ ကျပ် ထည့်ပါ',
      },
      eventDetail: {
        tabDetails: 'အသေးစိတ်',
        tabDonors: 'အလှူရှင်များ',
        perStudentRate: 'တစ်ဦးလျှင် သတ်မှတ်နှုန်း',
        announcements: 'စာရင်း ကြေညာချက်များ',
        initialNotice: 'အစောပိုင်း ကြေညာချက်',
        finalNotice: 'စာရင်းပိတ် ကြေညာချက်',
        noticeTip: 'Viber သို့မဟုတ် Telegram သို့ တိုက်ရိုက်ကူးယူ ထုတ်ပြန်နိုင်ပါသည်',
        deleteEvent: 'အခမ်းအနား ဖျက်မည်',
        addDonorTitle: 'အလှူရှင် ထည့်သွင်းရန်',
        donorStudentLabel: 'လှူဒါန်းသူ ကျောင်းသား',
        donorAmountLabel: 'အလှူငွေ ပမာဏ',
        submitDonor: 'အလှူရှင် သိမ်းမည်',
        errorSelectStudent: 'လှူဒါန်းသူ ကျောင်းသား ရွေးပါ',
        paidFilterAll: 'အားလုံး',
        paidFilterPaid: 'ပေးပြီး',
        paidFilterUnpaid: 'မပေးရသေး',
      },
      aesthetic: {
        title: 'Aesthetic Table Export',
        subtitle: 'လှပသော ဇယားဒီဇိုင်းဖြင့် Report ထုတ်ယူခြင်း',
        previewTab: 'အစမ်းကြည့်',
        optionsTab: 'ရွေးချယ်ရန်',
        layoutDual: 'ကော်လံ ၂ ခု',
        layoutTable: 'ဇယားကွက်',
        sourceStudentFines: 'ကျောင်းသား ဒဏ်ကြေး',
        sourceSubjectFines: 'ဘာသာရပ် ဒဏ်ကြေး',
        sourceEventDonors: 'အခမ်းအနား အလှူရှင်များ',
        sourceFinesLedger: 'ဒဏ်ကြေး မှတ်တမ်းအပြည့်အစုံ',
        filterAll: 'ကျောင်းသား အားလုံး',
        filterWithFines: 'ဒဏ်ကြေးရှိသူများ',
        filterUnpaid: 'မပေးရသေးသူများ',
        filterPaid: 'ပေးပြီးသူများ',
        downloadPNG: 'PNG ဒေါင်းလုဒ်',
        shareImage: 'မျှဝေမည်',
        copyImage: 'ပုံ ကူးယူမည်',
        exporting: 'ထုတ်ယူနေသည်...',
      },
    },
  },
  en: {
    tabs: {
      events: 'Events',
      fines: 'Fines',
      roster: 'Roster',
      reports: 'Reports',
      settings: 'Settings',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      remove: 'Remove',
      search: 'Search...',
      filter: 'Filter',
      all: 'All',
      paid: 'Paid',
      unpaid: 'Unpaid',
      status: 'Status',
      date: 'Date',
      amount: 'Amount',
      close: 'Close',
      back: 'Back',
      loading: 'Loading...',
      active: 'Connected',
      offline: 'Offline',
      total: 'Total',
      success: 'Success',
      error: 'Error',
      actions: 'Actions',
      export: 'Export',
      download: 'Download',
      copy: 'Copy',
      share: 'Share',
      preview: 'Preview',
      options: 'Options',
      details: 'Details',
      note: 'Note',
      optional: 'Optional',
      confirm: 'Confirm',
      reset: 'Reset',
      name: 'Name',
      phone: 'Phone',
      sync: 'Sync',
      done: 'Done',
    },
    events: {
      title: 'Events & Funds',
      subtitle: 'Donations and class fund collections',
      totalCollected: 'Total Collected',
      eventsCount: (count) => `${count} events recorded`,
      donation: 'Donation',
      fixedFee: 'Fixed Fee',
      perStudent: 'Per student rate',
      dueDate: 'Due date',
      newEvent: 'New Event',
      emptyTitle: 'No events yet',
      emptyDesc: 'Create a new event or collection to get started',
      createTitle: 'Create New Event',
      createButton: 'Create Event',
      nameLabel: 'Event Name',
      namePlaceholder: 'e.g. Teacher Homage, Kahtein, Class Fund',
      typeLabel: 'Collection Type',
      fixedAmountLabel: 'Amount per student',
      dueDateLabel: 'Due Date',
      noteLabel: 'Notes',
      notePlaceholder: 'Additional information...',
      collected: 'Collected',
      donorsCount: (count) => `${count} donors`,
      paidCount: (count) => `${count} paid`,
      filterAll: (count) => `All (${count})`,
      filterDonation: (count) => `Donation (${count})`,
      filterFixed: (count) => `Fixed Fee (${count})`,
      donorsList: 'Donors List',
      collectionRoster: 'Collection Roster',
      addDonor: 'Add Donor',
      addDonorSub: 'Record a new contribution',
      donorAmount: 'Donation Amount',
      selectDonor: 'Select student',
      searchDonors: 'Search donors...',
      searchEvents: 'Search events...',
      initialNotice: 'Initial Notice',
      finalReport: 'Closing Report',
      noticeCopied: 'Initial notice copied to clipboard',
      finalCopied: 'Closing report copied to clipboard',
      deleteConfirmTitle: 'Delete Event',
      deleteConfirmMsg: (name) => `Are you sure you want to delete "${name}" and all its records?`,
      eventCreatedToast: 'Event created successfully',
      eventDeletedToast: 'Event deleted successfully',
      donorAddedToast: 'Donor record added successfully',
      amountPaidTotal: 'Total Collected',
    },
    fines: {
      title: 'Fines',
      subtitle: 'Subject attendance and discipline fines',
      summaryTitle: 'Fines Summary',
      totalAll: 'Total Fines',
      paidTotal: 'Collected',
      unpaidTotal: 'Pending',
      allSubjects: 'All Subjects',
      allStatus: 'All',
      searchPlaceholder: 'Search student or reason...',
      batchFine: 'Issue Fine',
      imageExport: 'Export Image',
      emptyTitle: 'No fines recorded',
      emptyDesc: 'Tap the button below to issue a fine to students',
      deleteTitle: 'Delete Fine',
      deleteMsg: (name) => `Are you sure you want to delete fine record for "${name}"?`,
      deleteToast: 'Fine record deleted',
      markPaidToast: 'Marked as paid',
      markUnpaidToast: 'Marked as unpaid',
      reason: 'Reason',
      history: 'Fines Log',
      countFines: (count) => `${count} fines`,
      batchCountToast: (count) => `Fines issued for ${count} students`,
    },
    roster: {
      title: 'Roster & Subjects',
      subtitle: 'Manage class students and subjects',
      studentsTab: (count) => `Students (${count})`,
      subjectsTab: (count) => `Subjects (${count})`,
      searchStudents: 'Search by name or roll number...',
      searchSubjects: 'Search subject name...',
      addStudent: 'New Student',
      addSubject: 'New Subject',
      emptyStudentsTitle: 'No students found',
      emptyStudentsDesc: 'Add students to your class roster',
      emptySubjectsTitle: 'No subjects found',
      emptySubjectsDesc: 'Add teaching subjects to track fines',
      unpaidDues: 'Pending Dues',
      allClear: 'All Clear',
      deleteStudentTitle: 'Delete Student',
      deleteStudentMsg: (name) => `Are you sure you want to delete "${name}" from the roster?`,
      deleteStudentToast: 'Student deleted from roster',
      deleteSubjectTitle: 'Delete Subject',
      deleteSubjectMsg: (name) => `Are you sure you want to delete "${name}"?`,
      deleteSubjectToast: 'Subject deleted successfully',
      studentCount: (count) => `${count} students`,
      rollNumber: 'Roll',
      noRoll: 'No roll',
      noPhone: 'No phone',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Financial summaries and data export',
      financialStatus: 'Financial Overview',
      paidFines: 'Total Collected',
      unpaidFines: 'Pending Dues',
      subjectBreakdown: 'By Subject',
      studentDues: 'Students with Outstanding Dues',
      exportCSV: 'Export CSV',
      exportJSON: 'JSON Backup',
      imageExport: 'Export Image',
      noDuesTitle: 'All dues cleared',
      noDuesDesc: 'All students have paid their dues',
      noSubjects: 'No subject records yet',
      finesSummary: 'Fines Summary',
      rank: 'Rank',
      subject: 'Subject',
      student: 'Student',
      unpaidCount: (count) => `${count} unpaid`,
      totalFinesCount: (count) => `${count} fines`,
      csvSuccess: 'CSV file exported successfully',
      jsonSuccess: 'JSON backup downloaded',
      clipboardSuccess: 'Copied to clipboard',
    },
    settings: {
      title: 'Settings',
      subtitle: 'App preferences and data management',
      language: 'Language',
      languageSub: 'Select application language',
      english: 'English',
      burmese: 'မြန်မာ',
      appearance: 'Appearance',
      appearanceSub: 'Choose your preferred accent color',
      currentColor: 'Active Theme',
      presets: 'Preset Colors',
      cloudSync: 'Cloud Sync',
      cloudSyncSub: 'Real-time synchronization across devices',
      connected: 'Connected',
      offlineMode: 'Offline Mode',
      connectedAccount: 'Active Account',
      lastSync: (time) => `Last synced: ${time}`,
      syncNow: 'Sync Now',
      syncSuccess: 'Cloud sync completed successfully',
      syncError: 'Cloud sync failed',
      manageCloud: 'Manage Cloud Sync',
      enableCloud: 'Enable Cloud Sync',
      kbzPay: 'Payment Information',
      kbzPaySub: 'Account information used in broadcast announcements',
      accountName: 'KBZPay Account Name',
      accountNamePlaceholder: 'e.g. Kaung Sat Oo',
      phoneNumber: 'KBZPay Phone Number',
      phoneNumberPlaceholder: 'e.g. 09447131200',
      saveKbz: 'Save Payment Info',
      kbzSavedToast: 'Payment info saved successfully',
      dataBackup: 'Data Backup',
      dataBackupSub: 'Export your data or restore from backup',
      dangerZone: 'Danger Zone',
      dangerZoneSub: 'Reset all records back to default',
      resetAllData: 'Reset All Data',
      resetConfirmTitle: 'Reset Everything',
      resetConfirmMsg: 'Are you sure you want to delete all students, fines, and events?',
      resetSuccessToast: 'All data cleared and reset to default',
      themeChangedToast: 'Theme color updated',
    },
    modals: {
      addStudent: {
        titleAdd: 'Add Student',
        titleEdit: 'Edit Student',
        nameLabel: 'Student Name',
        namePlaceholder: 'e.g. Aung Kaung Myat',
        rollLabel: 'Roll Number',
        rollPlaceholder: 'e.g. 3CS-14 or 12',
        phoneLabel: 'Phone Number',
        phonePlaceholder: 'e.g. 09447131200',
        submitAdd: 'Add Student',
        submitEdit: 'Save Changes',
        errorRequired: 'Student name is required',
      },
      addSubject: {
        titleAdd: 'Add Subject',
        titleEdit: 'Edit Subject',
        nameLabel: 'Subject Name',
        namePlaceholder: 'e.g. Data Structures, AI, Java',
        submitAdd: 'Add Subject',
        submitEdit: 'Save Changes',
        errorRequired: 'Subject name is required',
      },
      batchFine: {
        title: 'Issue Fine',
        subtitle: 'Issue fines to multiple students at once',
        dateLabel: 'Date',
        subjectLabel: 'Subject',
        newSubjectInline: 'Add Subject',
        reasonLabel: 'Reason',
        reasonPlaceholder: 'e.g. Late attendance, Missing homework',
        amountLabel: 'Fine Amount',
        quickAmounts: 'Quick Presets',
        selectStudentsLabel: 'Select Students',
        searchStudentPlaceholder: 'Search students...',
        selectAll: 'Select All',
        selectedCount: (selected, total) => `${selected} of ${total} selected`,
        totalFinePreview: (amount) => `Total Fine: ${amount}`,
        submit: 'Issue Fines',
        errorSelectSubject: 'Please select a subject',
        errorReason: 'Please enter a fine reason',
        errorAmount: 'Please enter a valid amount',
        errorNoStudent: 'Select at least 1 student',
      },
      createEvent: {
        title: 'New Event',
        nameLabel: 'Event Name',
        namePlaceholder: 'e.g. Kahtein, Teacher Homage, Class Fund',
        typeLabel: 'Collection Type',
        fixedAmountLabel: 'Amount Per Student',
        dueDateLabel: 'Due Date',
        dueDatePlaceholder: 'DD/MM/YY',
        noteLabel: 'Notes',
        notePlaceholder: 'Additional information...',
        submit: 'Create Event',
        errorName: 'Event name is required',
        errorAmount: 'Amount must be at least 1 MMK',
      },
      eventDetail: {
        tabDetails: 'Details',
        tabDonors: 'Donors',
        perStudentRate: 'Per student rate',
        announcements: 'Announcements',
        initialNotice: 'Initial Notice',
        finalNotice: 'Closing Report',
        noticeTip: 'Ready to share directly to Viber or Telegram',
        deleteEvent: 'Delete Event',
        addDonorTitle: 'Add Donor',
        donorStudentLabel: 'Donor Student',
        donorAmountLabel: 'Donation Amount',
        submitDonor: 'Record Donation',
        errorSelectStudent: 'Please select a student',
        paidFilterAll: 'All',
        paidFilterPaid: 'Paid',
        paidFilterUnpaid: 'Unpaid',
      },
      aesthetic: {
        title: 'Aesthetic Table Export',
        subtitle: 'Export high quality aesthetic report images',
        previewTab: 'Preview',
        optionsTab: 'Options',
        layoutDual: 'Dual-Col',
        layoutTable: 'Table',
        sourceStudentFines: 'Student Fines',
        sourceSubjectFines: 'Subject Fines',
        sourceEventDonors: 'Event Donors',
        sourceFinesLedger: 'Fines Ledger',
        filterAll: 'All Students',
        filterWithFines: 'With Fines',
        filterUnpaid: 'Unpaid Only',
        filterPaid: 'Paid Only',
        downloadPNG: 'Download PNG',
        shareImage: 'Share Image',
        copyImage: 'Copy Image',
        exporting: 'Exporting...',
      },
    },
  },
};
