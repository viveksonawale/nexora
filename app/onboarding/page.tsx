"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useSession } from "@/lib/contexts/SessionContext";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { LoadingState } from "@/components/shared/states";
import { ShinyButton } from "@/app/components/ShinyButton";
import {
  GraduationCap,
  Building2,
  Scale,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Lock,
  Edit2,
  Search,
} from "lucide-react";

type RoleType = "STUDENT" | "COLLEGE_ORGANIZER" | "JUDGE";

interface CollegeOption {
  id: string;
  name: string;
  slug: string;
  city?: string;
  logoUrl?: string;
}

function OnboardingWizard() {
  const router = useRouter();
  const { user, refreshSession } = useSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType>("STUDENT");

  // Rejection info if previously rejected
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);

  // Form Details
  const [fullName, setFullName] = useState(user?.name || "");
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [isNewCollege, setIsNewCollege] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState("");

  // Student specific
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("3rd Year");
  const [rollNumber, setRollNumber] = useState("");

  // Organizer specific
  const [designation, setDesignation] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");

  // Judge specific
  const [judgeOrg, setJudgeOrg] = useState("");
  const [expertiseTags, setExpertiseTags] = useState<string[]>(["Fullstack", "AI / ML"]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // ID Upload
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idStorageKey, setIdStorageKey] = useState<string>("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Error & Submit states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch approved colleges and check previous rejection
  useEffect(() => {
    apiFetch<CollegeOption[]>("/organizations/colleges")
      .then((data) => {
        setColleges(data || []);
        if (data && data.length > 0 && !selectedCollegeId) {
          setSelectedCollegeId(data[0].id);
        }
      })
      .catch(() => {});

    apiFetch<any>("/verifications/me")
      .then((res) => {
        if (res?.onboardingStatus === "PENDING_VERIFICATION") {
          if (res?.requestedRole === "STUDENT" || res?.request?.type === "STUDENT") {
            router.replace("/student");
          } else {
            router.replace("/onboarding/pending");
          }
        } else if (res?.onboardingStatus === "VERIFIED" && (res?.requestedRole === "STUDENT" || res?.request?.type === "STUDENT")) {
          router.replace("/student");
        } else if (res?.onboardingStatus === "REJECTED" && res?.request?.rejectionReason) {
          setRejectionNotice(res.request.rejectionReason);
          if (res.request.type) {
            setSelectedRole(res.request.type);
          }
        }
      })
      .catch(() => {});
  }, [router, selectedCollegeId]);

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(collegeSearch.toLowerCase()))
  );

  const selectedCollegeObj = colleges.find((c) => c.id === selectedCollegeId);

  // Step 2 Validation
  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";

    if (selectedRole === "STUDENT") {
      if (!selectedCollegeId) errors.college = "Please select your college";
      if (!branch.trim()) errors.branch = "Branch / Field of study is required";
      if (!rollNumber.trim()) errors.rollNumber = "Roll Number / Student ID is required";
    } else if (selectedRole === "COLLEGE_ORGANIZER") {
      if (isNewCollege) {
        if (!newCollegeName.trim()) errors.newCollegeName = "College / Institution name is required";
      } else {
        if (!selectedCollegeId) errors.college = "Please select your college";
      }
      if (!designation.trim()) errors.designation = "Your designation / role title is required";
    } else if (selectedRole === "JUDGE") {
      if (!judgeOrg.trim()) errors.judgeOrg = "Company or Organization is required";
      if (!designation.trim()) errors.designation = "Current job title / designation is required";
      if (!linkedinUrl.trim()) errors.linkedinUrl = "LinkedIn profile URL is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 Validation & Upload
  const handleFileSelect = async (file: File) => {
    setApiError("");
    const validMimes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validMimes.includes(file.type)) {
      setApiError("Invalid file type. Only JPG, PNG, or PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApiError("File size exceeds 5MB limit.");
      return;
    }

    setIdFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }

    // Upload immediately to generate private storage key
    setUploading(true);
    try {
      const { storageKey, uploadUrl, headers } = await apiFetch<{
        storageKey: string;
        uploadUrl: string;
        headers: Record<string, string>;
      }>("/verifications/upload-url", {
        method: "POST",
        body: JSON.stringify({ mimeType: file.type, sizeBytes: file.size }),
      });

      // Upload directly to S3 via presigned PUT URL
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });

      if (!putRes.ok && !uploadUrl.includes("mock=true")) {
        throw new Error("Failed to upload document to secure storage.");
      }

      setIdStorageKey(storageKey);
    } catch (err: any) {
      setApiError(err.message || "Failed to upload document. Please try again.");
      setIdFile(null);
      setFilePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!idStorageKey && selectedRole !== "STUDENT") {
      setApiError("Please upload your identification proof before submitting.");
      setStep(3);
      return;
    }

    setSubmitting(true);
    setApiError("");

    const details: any = {
      fullName,
    };

    if (selectedRole === "STUDENT") {
      details.branch = branch;
      details.year = year;
      details.rollNumber = rollNumber;
    } else if (selectedRole === "COLLEGE_ORGANIZER") {
      details.designation = designation;
      details.officialEmail = officialEmail;
      if (isNewCollege) details.newCollegeName = newCollegeName;
    } else if (selectedRole === "JUDGE") {
      details.organization = judgeOrg;
      details.designation = designation;
      details.expertiseAreas = expertiseTags;
      details.linkedinUrl = linkedinUrl;
    }

    try {
      await apiFetch("/verifications", {
        method: "POST",
        body: JSON.stringify({
          role: selectedRole,
          organizationId: isNewCollege || selectedRole === "JUDGE" ? null : selectedCollegeId,
          newCollegeName: isNewCollege ? newCollegeName : null,
          details,
          idCardStorageKey: idStorageKey || null,
        }),
      });

      await refreshSession();
      if (selectedRole === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/onboarding/pending");
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to submit verification request.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
            Identity & Role Verification
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-[var(--text-primary)]">
            Welcome to Nexora
          </h1>
          <p className="text-[var(--text-secondary)] font-sans max-w-md mx-auto text-sm">
            Select your primary role to configure your verified profile and privileges.
          </p>
        </div>

        {/* Previous Rejection Alert */}
        {rejectionNotice && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">Previous request returned: </span>
              {rejectionNotice}
              <p className="mt-1 text-xs opacity-90">Please review your details, update your proof, and submit again.</p>
            </div>
          </div>
        )}

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 px-2">
          {[
            { num: 1, label: "Choose Role" },
            { num: 2, label: "Profile Details" },
            { num: 3, label: "ID Verification" },
            { num: 4, label: "Review & Submit" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold transition-all ${
                  step === s.num
                    ? "bg-[var(--accent)] text-white shadow-md shadow-orange-500/30"
                    : step > s.num
                    ? "bg-green-600/20 text-green-500 border border-green-500/30"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </span>
              <span className={`text-xs font-medium hidden sm:inline ${step === s.num ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error notification */}
        {apiError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* ================= STEP 1: SELECT ROLE ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Student Card */}
              <div
                onClick={() => setSelectedRole("STUDENT")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "STUDENT"
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] shadow-lg shadow-orange-500/10 scale-[1.02]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)]/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[var(--accent)] flex items-center justify-center">
                    <GraduationCap size={26} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Student</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                    Join hackathons, form squads, and earn verified resume achievements and certificates.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span className="text-emerald-500 font-semibold">Instant Setup (No Admin Review)</span>
                  {selectedRole === "STUDENT" && <CheckCircle2 size={16} className="text-emerald-500" />}
                </div>
              </div>

              {/* College Organizer Card */}
              <div
                onClick={() => setSelectedRole("COLLEGE_ORGANIZER")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "COLLEGE_ORGANIZER"
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] shadow-lg shadow-orange-500/10 scale-[1.02]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)]/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Building2 size={26} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">College Organizer</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                    Host hackathons for your college, run live check-in sessions, and issue digital certificates.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span>Reviewed by College / Platform Admin</span>
                  {selectedRole === "COLLEGE_ORGANIZER" && <CheckCircle2 size={16} className="text-[var(--accent)]" />}
                </div>
              </div>

              {/* Judge Card */}
              <div
                onClick={() => setSelectedRole("JUDGE")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedRole === "JUDGE"
                    ? "border-[var(--accent)] bg-[var(--bg-elevated)] shadow-lg shadow-orange-500/10 scale-[1.02]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-[var(--accent)]/50"
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Scale size={26} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">Judge / Mentor</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                    Review blind project submissions against scoring rubrics and evaluate innovator pitches.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span>Reviewed by Platform Admin</span>
                  {selectedRole === "JUDGE" && <CheckCircle2 size={16} className="text-[var(--accent)]" />}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <ShinyButton variant="primary" onClick={() => setStep(2)}>
                Continue to Details <ArrowRight size={16} className="ml-1" />
              </ShinyButton>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DETAILS FORM ================= */}
        {step === 2 && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
                {selectedRole === "STUDENT" && "Student Details"}
                {selectedRole === "COLLEGE_ORGANIZER" && "College Organizer Details"}
                {selectedRole === "JUDGE" && "Judge Credentials"}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Please provide accurate information for verification with your institution or company.
              </p>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                />
                {fieldErrors.fullName && <p className="text-xs text-red-500">{fieldErrors.fullName}</p>}
              </div>

              {/* STUDENT ROLE FIELDS */}
              {selectedRole === "STUDENT" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                      College / University
                    </label>
                    <div className="relative mb-2">
                      <Search size={16} className="absolute left-3 top-3 text-[var(--text-secondary)]" />
                      <input
                        type="text"
                        value={collegeSearch}
                        onChange={(e) => setCollegeSearch(e.target.value)}
                        placeholder="Search approved colleges..."
                        className="w-full pl-9 pr-4 py-2 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg text-xs font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <select
                      value={selectedCollegeId}
                      onChange={(e) => setSelectedCollegeId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                    >
                      {filteredColleges.length === 0 ? (
                        <option value="">No matching colleges found</option>
                      ) : (
                        filteredColleges.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.city ? `(${c.city})` : ""}
                          </option>
                        ))
                      )}
                    </select>
                    {fieldErrors.college && <p className="text-xs text-red-500">{fieldErrors.college}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Branch / Major
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Computer Science & Engg"
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                      {fieldErrors.branch && <p className="text-xs text-red-500">{fieldErrors.branch}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Year of Study
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Postgraduate">Postgraduate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                      Roll Number / Student ID
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 21CS042"
                      className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                    />
                    {fieldErrors.rollNumber && <p className="text-xs text-red-500">{fieldErrors.rollNumber}</p>}
                  </div>
                </>
              )}

              {/* ORGANIZER ROLE FIELDS */}
              {selectedRole === "COLLEGE_ORGANIZER" && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        College Affiliation
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsNewCollege(!isNewCollege)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        {isNewCollege ? "Select existing approved college" : "College not listed? Request new"}
                      </button>
                    </div>

                    {isNewCollege ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={newCollegeName}
                          onChange={(e) => setNewCollegeName(e.target.value)}
                          placeholder="Enter your college or institution name..."
                          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                        />
                        <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                          New college requests will be directly reviewed by Platform Administrators.
                        </p>
                        {fieldErrors.newCollegeName && <p className="text-xs text-red-500">{fieldErrors.newCollegeName}</p>}
                      </div>
                    ) : (
                      <>
                        <select
                          value={selectedCollegeId}
                          onChange={(e) => setSelectedCollegeId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                        >
                          {colleges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.city ? `(${c.city})` : ""}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.college && <p className="text-xs text-red-500">{fieldErrors.college}</p>}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Designation / Role Title
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Hackathon Lead / Tech Club Head"
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                      {fieldErrors.designation && <p className="text-xs text-red-500">{fieldErrors.designation}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Official College Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={officialEmail}
                        onChange={(e) => setOfficialEmail(e.target.value)}
                        placeholder="e.g. organizer@college.edu"
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* JUDGE ROLE FIELDS */}
              {selectedRole === "JUDGE" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Organization / Company
                      </label>
                      <input
                        type="text"
                        value={judgeOrg}
                        onChange={(e) => setJudgeOrg(e.target.value)}
                        placeholder="e.g. Google / Microsoft / Startup"
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                      {fieldErrors.judgeOrg && <p className="text-xs text-red-500">{fieldErrors.judgeOrg}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Designation / Title
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Senior Staff Engineer"
                        className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                      {fieldErrors.designation && <p className="text-xs text-red-500">{fieldErrors.designation}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourname"
                      className="w-full px-4 py-2.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-xl text-sm font-sans focus:outline-none focus:border-[var(--accent)]"
                    />
                    {fieldErrors.linkedinUrl && <p className="text-xs text-red-500">{fieldErrors.linkedinUrl}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                      Expertise Areas
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {expertiseTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg text-xs font-mono flex items-center gap-1.5"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => setExpertiseTags(expertiseTags.filter((t) => t !== tag))}
                            className="text-[var(--text-secondary)] hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customTagInput.trim()) {
                            e.preventDefault();
                            if (!expertiseTags.includes(customTagInput.trim())) {
                              setExpertiseTags([...expertiseTags, customTagInput.trim()]);
                            }
                            setCustomTagInput("");
                          }
                        }}
                        placeholder="Add skill tag (press Enter)"
                        className="flex-1 px-3 py-1.5 bg-[var(--bg-canvas)] border border-[var(--border)] rounded-lg text-xs font-sans focus:outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customTagInput.trim() && !expertiseTags.includes(customTagInput.trim())) {
                            setExpertiseTags([...expertiseTags, customTagInput.trim()]);
                            setCustomTagInput("");
                          }
                        }}
                        className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg text-xs font-sans hover:border-[var(--accent)]"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft size={14} className="inline mr-1" /> Back
              </button>
              <ShinyButton
                variant="primary"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
              >
                Continue to ID Upload <ArrowRight size={16} className="ml-1" />
              </ShinyButton>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ID UPLOAD ================= */}
        {step === 3 && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
                Identification Proof
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Upload a clear photo or scan of your College ID card, employee credential, or professional ID.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                idFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg-canvas)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {uploading ? (
                <div className="py-6 space-y-2">
                  <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono text-[var(--text-secondary)]">Encrypting & uploading document...</p>
                </div>
              ) : idFile ? (
                <div className="space-y-4">
                  {filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreview}
                      alt="ID Preview"
                      className="max-h-48 mx-auto rounded-xl object-contain border border-[var(--border)] shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
                      <FileText size={32} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{idFile.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">
                      {(idFile.size / 1024 / 1024).toFixed(2)} MB • Ready for submission
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdFile(null);
                      setIdStorageKey("");
                      setFilePreview(null);
                    }}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Change document
                  </button>
                </div>
              ) : (
                <div className="py-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[var(--accent)] mx-auto flex items-center justify-center">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Click to upload or drag & drop ID document
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
                      JPG, PNG, or PDF (Max size: 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Security Disclaimer */}
            <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] flex items-start gap-3">
              <Lock size={18} className="text-green-500 shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--text-primary)]">Private Storage & Protection: </span>
                Your identification document is kept strictly confidential in private storage and never shared publicly.
                Only the assigned institutional reviewer can inspect it via temporary signed access.
              </div>
            </div>

            {/* Student notice */}
            {selectedRole === "STUDENT" && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
                <span>Student accounts are automatically verified. ID upload is optional.</span>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="font-bold underline hover:text-white"
                >
                  Skip ID & Continue
                </button>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft size={14} className="inline mr-1" /> Back
              </button>
              <ShinyButton
                variant="primary"
                disabled={(!idStorageKey && selectedRole !== "STUDENT") || uploading}
                onClick={() => setStep(4)}
              >
                Review Summary <ArrowRight size={16} className="ml-1" />
              </ShinyButton>
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVIEW SUMMARY ================= */}
        {step === 4 && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
                Review & Confirm Verification
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Verify your details before submitting to the review queue.
              </p>
            </div>

            <div className="space-y-4 text-sm font-sans">
              
              {/* Role Section */}
              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">Selected Role</span>
                  <p className="font-bold text-[var(--text-primary)] mt-0.5">
                    {selectedRole === "STUDENT" && "Student"}
                    {selectedRole === "COLLEGE_ORGANIZER" && "College Organizer"}
                    {selectedRole === "JUDGE" && "Judge / Evaluator"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline"
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>

              {/* Details Section */}
              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">Profile Details</span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-[var(--text-secondary)]">Name:</span>
                    <p className="font-medium text-[var(--text-primary)]">{fullName}</p>
                  </div>

                  {selectedRole === "STUDENT" && (
                    <>
                      <div>
                        <span className="text-[var(--text-secondary)]">College:</span>
                        <p className="font-medium text-[var(--text-primary)]">{selectedCollegeObj?.name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Branch & Year:</span>
                        <p className="font-medium text-[var(--text-primary)]">{branch} ({year})</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Roll Number:</span>
                        <p className="font-medium text-[var(--text-primary)]">{rollNumber}</p>
                      </div>
                    </>
                  )}

                  {selectedRole === "COLLEGE_ORGANIZER" && (
                    <>
                      <div>
                        <span className="text-[var(--text-secondary)]">College:</span>
                        <p className="font-medium text-[var(--text-primary)]">
                          {isNewCollege ? `${newCollegeName} (New)` : selectedCollegeObj?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Designation:</span>
                        <p className="font-medium text-[var(--text-primary)]">{designation}</p>
                      </div>
                      {officialEmail && (
                        <div>
                          <span className="text-[var(--text-secondary)]">Official Email:</span>
                          <p className="font-medium text-[var(--text-primary)]">{officialEmail}</p>
                        </div>
                      )}
                    </>
                  )}

                  {selectedRole === "JUDGE" && (
                    <>
                      <div>
                        <span className="text-[var(--text-secondary)]">Organization:</span>
                        <p className="font-medium text-[var(--text-primary)]">{judgeOrg}</p>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Designation:</span>
                        <p className="font-medium text-[var(--text-primary)]">{designation}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[var(--text-secondary)]">LinkedIn:</span>
                        <p className="font-medium text-[var(--text-primary)] truncate">{linkedinUrl}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[var(--text-secondary)]">Expertise:</span>
                        <p className="font-medium text-[var(--text-primary)]">{expertiseTags.join(", ")}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ID Proof Section */}
              <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">Proof of Identity</span>
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate max-w-xs">
                      {idFile?.name || "Uploaded ID Document"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline"
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>

            </div>

            <div className="pt-2 text-xs text-[var(--text-secondary)] font-mono leading-relaxed">
              {selectedRole === "STUDENT"
                ? "Your student profile and college association will be activated immediately."
                : "By submitting, your verification request will be queued for administrator approval. You will receive email notifications regarding updates to your standing."}
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ArrowLeft size={14} className="inline mr-1" /> Back
              </button>
              <ShinyButton
                variant="primary"
                disabled={submitting}
                onClick={handleFinalSubmit}
              >
                {submitting
                  ? "Setting up..."
                  : selectedRole === "STUDENT"
                  ? "Complete Setup & Get Started"
                  : "Submit Verification Request"}
              </ShinyButton>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading verification portal..." />}>
      <RequireAuth requireOnboarding={false}>
        <OnboardingWizard />
      </RequireAuth>
    </Suspense>
  );
}
