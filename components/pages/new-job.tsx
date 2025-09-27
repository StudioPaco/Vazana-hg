"use client"

import { useState, useEffect } from "react"
import { Job, Client, WorkType, Worker, Vehicle, Cart } from "@/entities/all"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

// Helper to determine availability fields for a worker based on date and shift
const getWorkerAvailabilityKeys = (dateString, shiftType) => {
  if (!dateString || !shiftType) return null
  try {
    const date = new Date(dateString)
    const dayIndex = date.getDay() // 0 for Sunday
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    const dayKey = dayKeys[dayIndex]

    if (shiftType === "day") return [`available_${dayKey}_day`]
    if (shiftType === "night") return [`available_${dayKey}_night`]
    if (shiftType === "double") return [`available_${dayKey}_day`, `available_${dayKey}_night`]
    return null
  } catch (e) {
    console.error("Error parsing date for availability:", e)
    return null
  }
}

export default function NewJob() {
  const navigate = useNavigate()
  // Raw lists from API
  const [clients, setClients] = useState([])
  const [workTypes, setWorkTypes] = useState([]) // This state holds the work types for the dropdown
  const [allWorkers, setAllWorkers] = useState([])
  const [allVehicles, setAllVehicles] = useState([])
  const [allCarts, setAllCarts] = useState([])

  // Filtered/Sorted lists for display
  const [displayWorkers, setDisplayWorkers] = useState([])
  const [displayVehicles, setDisplayVehicles] = useState([])
  const [displayCarts, setDisplayCarts] = useState([])

  // No longer need separate sort states if we remove the sort dropdowns

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useExistingClient, setUseExistingClient] = useState(true)

  const [language, setLanguage] = useState(() => localStorage.getItem("vazana-language") || "he")

  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem("vazana-language") || "he"
      if (newLang !== language) setLanguage(newLang)
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChanged", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChanged", handleStorageChange)
    }
  }, [language])

  const isHebrew = language === "he"

  const texts = {
    en: {
      title: "New Job",
      subtitle: "Create a new service job entry",
      jobDetails: "Job Details",
      jobNumber: "Job Number",
      jobDate: "Job Date",
      workType: "Work Type",
      shiftType: "Shift Type",
      day: "Day",
      night: "Night",
      double: "Double",
      site: "Site",
      city: "City",
      clientInfo: "Client Information",
      existingClient: "Existing Client",
      newClient: "New Client",
      selectClient: "Select Client",
      companyName: "Company Name",
      contactPerson: "Contact Person",
      phone: "Phone Number",
      address: "Address",
      clientCity: "City",
      poBox: "P.O. Box (Optional)",
      email: "Email",
      paymentMethod: "Payment Method (Days)",
      securityRate: "Security Rate (₪/shift)",
      installationRate: "Installation Rate (₪/shift)",
      derivedNewClientRate: "Derived Rate for New Client (₪/shift)",
      jobSpecificShiftRate: "Job-Specific Shift Rate (₪)",
      jobSpecificShiftRatePlaceholder: "Optional: Override standard rate for this shift",
      workResources: "Work Resources",
      worker: "Worker",
      selectWorker: "Select Worker",
      vehicle: "Vehicle",
      selectVehicle: "Select Vehicle",
      cart: "Cart/Trailer",
      selectCart: "Select Cart/Trailer",
      calendar: "Calendar Integration",
      addToCalendar: "Add to Google Calendar",
      calendarDesc: "Create calendar event for this job",
      notes: "Job Description & Notes",
      additionalNotesPlaceholder: "Describe the work to be done and any other important details...",
      createJob: "Create Job",
      creatingJob: "Creating Job...",
      cancel: "Cancel",
      fieldRequired: "This field is required",
      jobCreatedSuccess: "Job created successfully!",
      selectWorkType: "Select Work Type",
      selectShiftType: "Select Shift Type",
      sitePlaceholder: "e.g., Main Office, Building A",
      cityPlaceholder: "e.g., London, Tel Aviv",
      loadingData: "Loading initial data...",
      security: "Security",
      installations: "Installations",
      numbersOnlyError: "Please enter numbers only for rate fields.",
      noAvailableWorkers:
        "No workers available for this date/shift. Please check worker schedules or adjust job date/shift.",
      vehicleCartAvailabilityNote:
        "Note: Vehicle and Cart availability based on current date/shift is not yet implemented. Showing all items.",
    },
    he: {
      title: "עבודה חדשה",
      subtitle: "יצירת כרטיס עבודה חדש",
      jobDetails: "פרטי העבודה",
      jobNumber: "מספר עבודה",
      jobDate: "תאריך",
      workType: "סוג עבודה",
      shiftType: "סוג משמרת",
      day: "יום",
      night: "לילה",
      double: "כפולה",
      site: "אתר",
      city: "עיר",
      clientInfo: "פרטי הלקוח",
      existingClient: "לקוח קיים",
      newClient: "לקוח חדש",
      selectClient: "בחר לקוח",
      companyName: "שם החברה",
      contactPerson: "איש קשר",
      phone: "מספר טלפון",
      address: "כתובת",
      clientCity: "עיר",
      poBox: "תיבת דואר (אופציונלי)",
      email: 'דוא"ל',
      paymentMethod: "אופן תשלום (ימים)",
      securityRate: "תעריף אבטחה (₪/משמרת)",
      installationRate: "תעריף התקנות (₪/משמרת)",
      derivedNewClientRate: "תעריף מחושב ללקוח חדש (₪/משמרת)",
      jobSpecificShiftRate: "תעריף מיוחד למשמרת (₪)",
      jobSpecificShiftRatePlaceholder: "אופציונלי: דורס תעריף סטנדרטי למשמרת זו",
      workResources: "משאבי עבודה",
      worker: "עובד",
      selectWorker: "בחר עובד",
      vehicle: "רכב",
      selectVehicle: "בחר רכב",
      cart: "עגלה/נגרר",
      selectCart: "בחר עגלה/נגרר",
      calendar: "סנכרון ליומן",
      addToCalendar: "הוסף ליומן גוגל",
      calendarDesc: "צור אירוע ביומן עבור עבודה זו",
      notes: "תיאור העבודה והערות",
      additionalNotesPlaceholder: "תאר את העבודה לביצוע וכל פרט חשוב אחר...",
      createJob: "צור עבודה",
      creatingJob: "יוצר עבודה...",
      cancel: "ביטול",
      fieldRequired: "שדה חובה",
      jobCreatedSuccess: "העבודה נוצרה בהצלחה!",
      selectWorkType: "בחר סוג עבודה",
      selectShiftType: "בחר סוג משמרת",
      sitePlaceholder: "לדוגמה, משרד ראשי, בניין א'",
      cityPlaceholder: "לדוגמה, תל אביב, לונדון",
      loadingData: "טוען נתונים ראשוניים...",
      security: "אבטחה",
      installations: "התקנות",
      numbersOnlyError: "נא להזין מספרים בלבד בשדות התעריף.",
      noAvailableWorkers:
        "אין עובדים זמינים לתאריך/משמרת אלו. אנא בדוק את לוחות הזמנים של העובדים או שנה את תאריך/משמרת העבודה.",
      vehicleCartAvailabilityNote: "הערה: סינון זמינות רכבים ועגלות לפי תאריך/משמרת עדיין לא מיושם. כל הפריטים מוצגים.",
    },
  }
  const t = texts[language]

  const [formData, setFormData] = useState({
    job_number: "",
    job_date: format(new Date(), "yyyy-MM-dd"),
    work_type: "",
    work_type_name_display: "",
    shift_type: "",
    site: "",
    city: "",
    job_specific_shift_rate: "",
    client_id: "",
    client_name: "",
    new_company_name: "",
    new_contact_person: "",
    new_phone: "",
    new_address: "",
    new_city: "",
    new_po_box: "",
    new_email: "",
    new_payment_method: "30",
    new_security_rate: "",
    new_installation_rate: "",
    new_derived_job_rate: "",
    worker_id: "",
    worker_name: "",
    vehicle_id: "",
    vehicle_name: "",
    cart_id: "",
    cart_name: "",
    notes: "",
    add_to_calendar: false,
    payment_status: "pending",
  })

  const [selectedClient, setSelectedClient] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadInitialData()
  }, [])

  // Effect for filtering and sorting workers (default sort: name ascending, then rate ascending)
  useEffect(() => {
    let filtered = [...allWorkers]
    const availabilityKeys = getWorkerAvailabilityKeys(formData.job_date, formData.shift_type)

    if (availabilityKeys) {
      filtered = filtered.filter((worker) => {
        if (!worker.availability) return false // Worker might not have availability object yet
        const dayKey = availabilityKeys[0].split("_")[1] // e.g., 'sun' from 'available_sun_day'
        if (!worker.availability[dayKey]) return false

        if (formData.shift_type === "day") return worker.availability[dayKey].day
        if (formData.shift_type === "night") return worker.availability[dayKey].night
        if (formData.shift_type === "double")
          return worker.availability[dayKey].day && worker.availability[dayKey].night
        return false
      })
    }

    // Default sort by name ascending, then by rate ascending
    filtered.sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name)
      if (nameComparison !== 0) return nameComparison
      return (a.shift_rate || 0) - (b.shift_rate || 0)
    })

    setDisplayWorkers(filtered)
  }, [allWorkers, formData.job_date, formData.shift_type])

  // Effect for sorting vehicles (default sort: name ascending)
  useEffect(() => {
    const sorted = [...allVehicles]
    sorted.sort((a, b) => a.name.localeCompare(b.name))
    setDisplayVehicles(sorted)
  }, [allVehicles])

  // Effect for sorting carts (default sort: name ascending)
  useEffect(() => {
    const sorted = [...allCarts]
    sorted.sort((a, b) => a.name.localeCompare(b.name))
    setDisplayCarts(sorted)
  }, [allCarts])

  useEffect(() => {
    if (!useExistingClient && formData.work_type) {
      const selectedWorkType = workTypes.find((wt) => wt.id === formData.work_type)
      if (selectedWorkType) {
        const rate =
          (isHebrew
            ? (selectedWorkType.name_he ?? selectedWorkType.name_en)
            : (selectedWorkType.name_en ?? selectedWorkType.name_he)) === (isHebrew ? "אבטחה" : "Security")
            ? formData.new_security_rate
            : (isHebrew
                  ? (selectedWorkType.name_he ?? selectedWorkType.name_en)
                  : (selectedWorkType.name_en ?? selectedWorkType.name_he)) === (isHebrew ? "התקנות" : "Installations")
              ? formData.new_installation_rate
              : ""
        if (String(rate) !== String(formData.new_derived_job_rate)) {
          setFormData((prev) => ({ ...prev, new_derived_job_rate: rate || "" }))
        }
      }
    } else if (useExistingClient) {
      setFormData((prev) => ({ ...prev, new_derived_job_rate: "" }))
    }
  }, [
    formData.work_type,
    formData.new_security_rate,
    formData.new_installation_rate,
    useExistingClient,
    formData.new_derived_job_rate,
    workTypes,
    isHebrew,
  ])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Starting to load initial data...")
      
      const [clientsData, workTypesRawData, workersData, vehiclesData, cartsData, allJobsData] = await Promise.all([
        Client.list("company_name").then((data) => {
          console.log("[v0] Loaded clients:", data?.length || 0, "items")
          return data.filter((c) => c.status === "active")
        }),
        WorkType.list().then((data) => {
          console.log("[v0] Loaded work types:", data?.length || 0, "items")
          return data
        }),
        Worker.list().then((data) => {
          console.log("[v0] Loaded workers:", data?.length || 0, "items")
          return data
        }),
        Vehicle.list().then((data) => {
          console.log("[v0] Loaded vehicles:", data?.length || 0, "items")
          return data
        }),
        Cart.list().then((data) => {
          console.log("[v0] Loaded carts:", data?.length || 0, "items")
          return data
        }),
        Job.list("-created_date").then((data) => {
          console.log("[v0] Loaded jobs:", data?.length || 0, "items")
          return data
        }),
      ])

      console.log("[v0] Raw data loaded:", {
        clients: clientsData?.length || 0,
        workTypes: workTypesRawData?.length || 0,
        workers: workersData?.length || 0,
        vehicles: vehiclesData?.length || 0,
        carts: cartsData?.length || 0,
        jobs: allJobsData?.length || 0
      })

      const validWorkTypesRaw = (Array.isArray(workTypesRawData) ? workTypesRawData : []).filter((wt) => {
        const hasId = wt && typeof wt === "object" && wt.id
        const hasNameEn = wt.name_en && typeof wt.name_en === "string" && wt.name_en.trim() !== ""
        const hasNameHe = wt.name_he && typeof wt.name_he === "string" && wt.name_he.trim() !== ""
        return hasId && (hasNameEn || hasNameHe)
      })

      const processedWorkTypes = [...validWorkTypesRaw].sort((a, b) => {
        const nameA_en = (a.name_en ?? "").toLowerCase()
        const nameB_en = (b.name_en ?? "").toLowerCase()
        const nameA_he = a.name_he ?? ""
        const nameB_he = b.name_he ?? ""

        const securityEn = "security"
        const securityHe = "אבטחה"
        const installationsEn = "installations"
        const installationsHe = "התקנות"

        const isASecurity = nameA_en.includes(securityEn) || nameA_he.includes(securityHe)
        const isBSecurity = nameB_en.includes(securityEn) || nameB_he.includes(securityHe)
        const isAInstallations = nameA_en.includes(installationsEn) || nameA_he.includes(installationsHe)
        const isBInstallations = nameB_en.includes(installationsEn) || nameB_he.includes(installationsHe)

        if (isASecurity && !isBSecurity) return -1
        if (!isASecurity && isBSecurity) return 1
        if (isAInstallations && !isBInstallations) return -1
        if (!isAInstallations && isBInstallations) return 1

        if (nameA_en && nameB_en) return nameA_en.localeCompare(nameB_en)
        if (a.name_he && b.name_he) return a.name_he.localeCompare(b.name_he)
        return 0
      })

      setClients(clientsData)
      setWorkTypes(processedWorkTypes) // Set the processed work types here
      setAllWorkers(workersData)
      setAllVehicles(vehiclesData)
      setAllCarts(cartsData)

      console.log("[v0] State updated with data:", {
        clients: clientsData?.length || 0,
        workTypes: processedWorkTypes?.length || 0,
        workers: workersData?.length || 0,
        vehicles: vehiclesData?.length || 0,
        carts: cartsData?.length || 0
      })

      generateJobNumber(allJobsData)

      const lastJob = allJobsData.length > 0 ? allJobsData[0] : null
      setFormData((prev) => ({
        ...prev,
        add_to_calendar: lastJob ? lastJob.add_to_calendar : false,
      }))
    } catch (error) {
      console.error("[v0] Error loading initial data:", error)
      setErrors((prev) => ({ ...prev, load: "Failed to load initial data. " + (error.message || "") }))
    }
    setIsLoading(false)
  }

  const generateJobNumber = (allJobs) => {
    let maxNum = 0
    allJobs.forEach((job) => {
      const num = Number.parseInt(job.job_number, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    })
    const nextNum = maxNum + 1
    setFormData((prev) => ({ ...prev, job_number: String(nextNum).padStart(4, "0") }))
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    if ((field === "job_date" || field === "shift_type") && formData.worker_id) {
      setFormData((prev) => ({ ...prev, worker_id: "", worker_name: "" }))
    }
  }

  const handleWorkTypeChange = (workTypeId) => {
    const selectedWT = workTypes.find((wt) => wt.id === workTypeId)
    handleChange("work_type", workTypeId)
    handleChange(
      "work_type_name_display",
      selectedWT
        ? isHebrew
          ? (selectedWT.name_he ?? selectedWT.name_en)
          : (selectedWT.name_en ?? selectedWT.name_he)
        : "",
    )
  }

  const handleNumericInputChange = (field, value) => {
    if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
      handleChange(field, value)
    } else {
      setErrors((prev) => ({ ...prev, [field]: t.numbersOnlyError }))
      setTimeout(() => setErrors((prev) => ({ ...prev, [field]: null })), 3000)
    }
  }

  const handleSelectChange = (field, selectedId, itemList, nameFieldInForm, actualNameFieldInItem = "name") => {
    let sourceList = itemList
    if (field === "worker_id") sourceList = displayWorkers
    if (field === "vehicle_id") sourceList = displayVehicles
    if (field === "cart_id") sourceList = displayCarts

    const selectedItem = sourceList.find((item) => item.id === selectedId)
    setFormData((prev) => ({
      ...prev,
      [field]: selectedId,
      [nameFieldInForm]: selectedItem ? selectedItem[actualNameFieldInItem] : "",
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c.id === clientId)
    setSelectedClient(client)
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      client_name: client ? client.company_name : "",
      job_specific_shift_rate: "",
    }))
    if (errors.client_id) {
      setErrors((prev) => ({ ...prev, client_id: null }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    const requiredJobFields = [
      "job_date",
      "work_type",
      "shift_type",
      "site",
      "city",
      "worker_id",
      "vehicle_id",
      "cart_id",
    ]

    requiredJobFields.forEach((field) => {
      if (!formData[field] || String(formData[field]).trim() === "") {
        newErrors[field] = t.fieldRequired
      }
    })

    if (useExistingClient) {
      if (!formData.client_id) newErrors.client_id = t.fieldRequired
    } else {
      const requiredNewClientFields = {
        new_company_name: t.fieldRequired,
        new_contact_person: t.fieldRequired,
        new_phone: t.fieldRequired,
        new_email: t.fieldRequired,
        new_address: t.fieldRequired,
        new_city: t.fieldRequired,
        new_payment_method: t.fieldRequired,
        new_security_rate: t.fieldRequired,
        new_installation_rate: t.fieldRequired,
      }
      for (const field in requiredNewClientFields) {
        if (!formData[field] || String(formData[field]).trim() === "") {
          newErrors[field] = requiredNewClientFields[field]
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      let finalClientId = formData.client_id
      let finalClientName = formData.client_name

      if (!useExistingClient) {
        const newClientData = {
          company_name: formData.new_company_name,
          contact_person: formData.new_contact_person,
          phone: formData.new_phone,
          address: formData.new_address,
          city: formData.new_city,
          po_box: formData.new_po_box || null,
          email: formData.new_email,
          payment_method: formData.new_payment_method ? Number(formData.new_payment_method) : 30,
          security_rate: formData.new_security_rate ? Number(formData.new_security_rate) : null,
          installation_rate: formData.new_installation_rate ? Number(formData.new_installation_rate) : null,
          status: "active",
        }
        const newClient = await Client.create(newClientData)
        finalClientId = newClient.id
        finalClientName = newClient.company_name
      }

      let calculatedTotalAmount = null
      if (formData.job_specific_shift_rate) {
        calculatedTotalAmount = Number(formData.job_specific_shift_rate)
      } else if (useExistingClient && selectedClient && formData.work_type) {
        const selectedWorkType = workTypes.find((wt) => wt.id === formData.work_type)
        if (selectedWorkType) {
          const workTypeNameForRate = isHebrew
            ? (selectedWorkType.name_he ?? selectedWorkType.name_en)
            : (selectedWorkType.name_en ?? selectedWorkType.name_he)
          const securityName = isHebrew ? "אבטחה" : "Security"
          const installationsName = isHebrew ? "התקנות" : "Installations"

          if (workTypeNameForRate === securityName && selectedClient.security_rate != null) {
            calculatedTotalAmount = selectedClient.security_rate
          } else if (workTypeNameForRate === installationsName && selectedClient.installation_rate != null) {
            calculatedTotalAmount = selectedClient.installation_rate
          }
        }
      } else if (!useExistingClient && formData.new_derived_job_rate) {
        calculatedTotalAmount = Number(formData.new_derived_job_rate)
      }
      if (formData.shift_type === "double" && calculatedTotalAmount != null) {
        calculatedTotalAmount *= 2
      }

      const selectedWorkTypeForJob = workTypes.find((wt) => wt.id === formData.work_type)

      const jobDataToCreate = {
        job_number: formData.job_number,
        client_id: finalClientId,
        client_name: finalClientName,
        job_date: formData.job_date,
        work_type: selectedWorkTypeForJob
          ? isHebrew
            ? (selectedWorkTypeForJob.name_he ?? selectedWorkTypeForJob.name_en)
            : (selectedWorkTypeForJob.name_en ?? selectedWorkTypeForJob.name_he)
          : formData.work_type_name_display,
        shift_type: formData.shift_type,
        site: formData.site,
        city: formData.city,
        service_description: formData.notes,
        worker_id: formData.worker_id,
        worker_name: formData.worker_name,
        cart_id: formData.cart_id,
        cart_name: formData.cart_name,
        vehicle_id: formData.vehicle_id,
        vehicle_name: formData.vehicle_name,
        job_specific_shift_rate: formData.job_specific_shift_rate ? Number(formData.job_specific_shift_rate) : null,
        payment_status: formData.payment_status,
        notes: formData.notes,
        add_to_calendar: formData.add_to_calendar,
        total_amount: calculatedTotalAmount,
      }

      await Job.create(jobDataToCreate)
      navigate(createPageUrl("Jobs"))
    } catch (error) {
      console.error("Error creating job:", error)
      setErrors((prev) => ({ ...prev, submit: "Failed to create job. " + (error.message || "") }))
    }
    setIsSubmitting(false)
  }

  if (isLoading && !clients.length) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          {[1, 2, 3].map((i) => (
            <Card key={i} className="mb-6 shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-1/4" />
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`p-6 lg:p-8 ${isHebrew ? "rtl" : "ltr"}`}>
        <div>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-1">{t.title}</h1>
              <p className="text-neutral-600">{t.subtitle}</p>
            </div>
            {formData.job_number && (
              <div className={`${isHebrew ? "text-left" : "text-right"}`}>
                <Label htmlFor="job_number_display" className="text-sm text-neutral-500">
                  {t.jobNumber}
                </Label>
                <p id="job_number_display" className="text-2xl font-bold text-primary">
                  {formData.job_number}
                </p>
              </div>
            )}
          </div>

          {errors.load && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-4">{errors.load}</p>}
          {errors.submit && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-4">{errors.submit}</p>}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Details Card */}
            <Card className="shadow-lg overflow-hidden bg-white border-neutral-200">
              <CardHeader className="bg-neutral-50 border-b border-neutral-200">
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <Briefcase className="w-5 h-5 text-primary" />
                  {t.jobDetails}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="job_date" className="font-medium text-neutral-700">
                    {t.jobDate} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="job_date"
                    type="date"
                    value={formData.job_date}
                    onChange={(e) => handleChange("job_date", e.target.value)}
                    className={`mt-1 border-neutral-300 focus:border-primary text-neutral-900 ${errors.job_date ? "border-red-500" : ""}`}
                  />
                  {errors.job_date && <p className="text-xs text-red-500 mt-1">{errors.job_date}</p>}
                </div>
                <div>
                  <Label htmlFor="work_type" className="font-medium text-neutral-700">
                    {t.workType} <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.work_type} onValueChange={handleWorkTypeChange}>
                    <SelectTrigger
                      className={`mt-1 border-neutral-300 focus:border-primary text-neutral-900 ${errors.work_type ? "border-red-500" : ""}`}
                      dir={isHebrew ? "rtl" : "ltr"}
                    >
                      <SelectValue placeholder={t.selectWorkType} />
                    </SelectTrigger>
                    <SelectContent dir={isHebrew ? "rtl" : "ltr"}>
                      {workTypes.map((wt) => (
                        <SelectItem key={wt.id} value={wt.id}>
                          {isHebrew ? (wt.name_he ?? wt.name_en) : (wt.name_en ?? wt.name_he)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.work_type && <p className="text-xs text-red-500 mt-1">{errors.work_type}</p>}
                  {workTypes.length === 0 && !isLoading && (
                    <p className="text-xs text-orange-500 mt-1">
                      {isHebrew
                        ? \"לא הוגדרו סוגי עבודה. אנ
