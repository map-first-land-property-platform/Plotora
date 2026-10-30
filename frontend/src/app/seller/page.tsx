"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

type PropertyStatus = "Active" | "Pending" | "Draft";
type PropertyCategory =
  | "Land"
  | "House"
  | "Apartment"
  | "Commercial"
  | "Villa";

interface Property {
  id: number;
  title: string;
  location: string;
  category: PropertyCategory;
  price: number;
  size: string;
  description: string;
  status: PropertyStatus;
}

const initialProperties: Property[] = [
  {
    id: 1,
    title: "Residential Land in Galle",
    location: "Galle, Southern Province",
    category: "Land",
    price: 4500000,
    size: "15 perches",
    description:
      "Residential land in a convenient location in Galle, with access to nearby roads and essential facilities.",
    status: "Active",
  },
  {
    id: 2,
    title: "Modern Family House",
    location: "Matara, Southern Province",
    category: "House",
    price: 18500000,
    size: "2,000 sq ft",
    description:
      "A spacious family home in Matara, suitable for comfortable family living.",
    status: "Pending",
  },
  {
    id: 3,
    title: "Commercial Property",
    location: "Weligama, Southern Province",
    category: "Commercial",
    price: 12000000,
    size: "30 perches",
    description:
      "Commercial property in Weligama with potential for business development.",
    status: "Draft",
  },
];

const categories: PropertyCategory[] = [
  "Land",
  "House",
  "Apartment",
  "Commercial",
  "Villa",
];

const emptyForm = {
  title: "",
  location: "",
  category: "Land" as PropertyCategory,
  price: "",
  size: "",
  description: "",
};

type IconName =
  | "dashboard"
  | "building"
  | "plus"
  | "map"
  | "check"
  | "clock"
  | "document"
  | "search"
  | "eye"
  | "edit"
  | "trash"
  | "close"
  | "location"
  | "home"
  | "menu";

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 21v-4h6v4M8 7h2m4 0h2M8 11h2m4 0h2M8 14h2m4 0h2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    map: (
      <>
        <path d="M20.5 10c0 5.5-8.5 12-8.5 12S3.5 15.5 3.5 10a8.5 8.5 0 1 1 17 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    document: (
      <>
        <path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M14 3v5h5M8 13h8M8 17h8" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    edit: (
      <>
        <path d="m15 5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7m4-7v7" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
    location: (
      <>
        <path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function formatPrice(price: number) {
  return `LKR ${price.toLocaleString("en-LK")}`;
}

export default function SellerPage() {
  const [properties, setProperties] =
    useState<Property[]>(initialProperties);

  const [activeSection, setActiveSection] = useState<
    "dashboard" | "listings"
  >("dashboard");

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingProperty, setViewingProperty] =
    useState<Property | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState(emptyForm);

  const activeCount = properties.filter(
    (property) => property.status === "Active"
  ).length;

  const pendingCount = properties.filter(
    (property) => property.status === "Pending"
  ).length;

  const totalAskingValue = properties.reduce(
    (total, property) => total + property.price,
    0
  );

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return properties;

    return properties.filter((property) =>
      [
        property.title,
        property.location,
        property.category,
        property.status,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [properties, searchQuery]);

  function openNewPropertyForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
    setActiveSection("listings");
    setMobileMenuOpen(false);
  }

  function openEditForm(property: Property) {
    setEditingId(property.id);
    setForm({
      title: property.title,
      location: property.location,
      category: property.category,
      price: String(property.price),
      size: property.size,
      description: property.description,
    });
    setFormError("");
    setShowForm(true);
    setActiveSection("listings");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const price = Number(form.price);

    if (!form.title.trim() || !form.location.trim()) {
      setFormError("Please enter the property title and location.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError("Please enter a valid asking price.");
      return;
    }

    const updatedPropertyData = {
      title: form.title.trim(),
      location: form.location.trim(),
      category: form.category,
      price,
      size: form.size.trim(),
      description: form.description.trim(),
    };

    if (editingId !== null) {
      setProperties((current) =>
        current.map((property) =>
          property.id === editingId
            ? { ...property, ...updatedPropertyData }
            : property
        )
      );
    } else {
      const newProperty: Property = {
        id: Date.now(),
        ...updatedPropertyData,
        status: "Draft",
      };

      setProperties((current) => [newProperty, ...current]);
    }

    cancelForm();
  }

  function deleteProperty(id: number) {
    const property = properties.find((item) => item.id === id);

    if (!property) return;

    const confirmed = window.confirm(
      `Delete "${property.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setProperties((current) =>
      current.filter((property) => property.id !== id)
    );

    if (viewingProperty?.id === id) {
      setViewingProperty(null);
    }
  }

  function changeStatus(id: number, status: PropertyStatus) {
    setProperties((current) =>
      current.map((property) =>
        property.id === id ? { ...property, status } : property
      )
    );
  }

  function navigateTo(section: "dashboard" | "listings") {
    setActiveSection(section);
    setMobileMenuOpen(false);

    if (section === "dashboard") {
      cancelForm();
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#172c48]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col border-r border-[#e0e7f0] bg-white transition-transform duration-200 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex min-h-[88px] items-center border-b border-[#edf0f5] px-6">
          <a
            href="/"
            className="flex items-center"
            aria-label="Plotora home"
          >
            <Image
              src="/images/plotora-logo.png"
              alt="Plotora"
              width={220}
              height={78}
              priority
              className="h-auto w-[166px] object-contain"
            />
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-6 pb-4 pt-3">
          <p className="text-xs text-slate-500">Seller workspace</p>
        </div>

        <nav className="flex-1 px-4 py-3">
          <p className="mb-4 px-2 text-[11px] font-bold tracking-[0.14em] text-slate-400">
            WORKSPACE
          </p>

          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
            className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition ${
              activeSection === "dashboard"
                ? "bg-[#e9faf3] font-semibold text-[#007f60]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon name="dashboard" size={19} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigateTo("listings")}
            className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition ${
              activeSection === "listings"
                ? "bg-[#e9faf3] font-semibold text-[#007f60]"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon name="building" size={19} />
            My Listings
          </button>

          <button
            type="button"
            onClick={openNewPropertyForm}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
          >
            <Icon name="plus" size={20} />
            Add Property
          </button>

          <div className="mt-12 rounded-3xl bg-[#eafbf3] p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-[#008663]">
              <Icon name="map" size={25} />
            </div>

            <h3 className="mb-2 font-serif text-base font-bold text-[#15324a]">
              Location first
            </h3>

            <p className="text-sm leading-6 text-slate-600">
              Help buyers discover your property through its location.
            </p>
          </div>
        </nav>

        <div className="border-t border-[#edf0f5] p-5">
          <p className="text-xs text-slate-400">
            Plotora Seller Workspace
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Property management
          </p>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
        />
      )}

      {/* Main area */}
      <div className="min-h-screen md:ml-[274px]">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex min-h-[88px] items-center justify-between gap-4 border-b border-[#e0e7f0] bg-white px-5 sm:px-8 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Open navigation"
            >
              <Icon name="menu" size={23} />
            </button>

            <div>
              <p className="text-xs text-slate-500">Seller Portal</p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-[#12243e]">
                {activeSection === "dashboard"
                  ? "My Dashboard"
                  : "My Listings"}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewPropertyForm}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#00845f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#006d4f] sm:px-5"
          >
            <Icon name="plus" size={19} />
            <span className="hidden sm:inline">Add Property</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          {/* Welcome */}
          <section className="mb-8">
            <h2 className="font-serif text-xl font-bold text-[#172b45]">
              Welcome back!
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage your properties and listing activity.
            </p>
          </section>

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="building"
              label="Total Listings"
              value={String(properties.length)}
            />

            <StatCard
              icon="check"
              label="Active Listings"
              value={String(activeCount)}
            />

            <StatCard
              icon="clock"
              label="Pending Review"
              value={String(pendingCount)}
            />

            <StatCard
              icon="document"
              label="Total Asking Value"
              value={formatCompactPrice(totalAskingValue)}
            />
          </section>

          {/* Add / Edit form */}
          {showForm && (
            <section
              id="property-form"
              className="mb-8 overflow-hidden rounded-3xl border border-[#e0e7f0] bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#edf0f5] px-6 py-5 sm:px-7">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#172b45]">
                    {editingId !== null
                      ? "Edit Property Listing"
                      : "Create a Property Listing"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Enter accurate property details for potential buyers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelForm}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close property form"
                >
                  <Icon name="close" size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-7">
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 lg:grid-cols-2">
                  <FormField label="Property title" required>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                      placeholder="e.g. Residential land in Galle"
                      className="form-input"
                      required
                      maxLength={120}
                    />
                  </FormField>

                  <FormField label="Location" required>
                    <input
                      value={form.location}
                      onChange={(event) =>
                        setForm({ ...form, location: event.target.value })
                      }
                      placeholder="Town, district or province"
                      className="form-input"
                      required
                      maxLength={160}
                    />
                  </FormField>

                  <FormField label="Property category" required>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          category: event.target.value as PropertyCategory,
                        })
                      }
                      className="form-input"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Asking price (LKR)" required>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.price}
                      onChange={(event) =>
                        setForm({ ...form, price: event.target.value })
                      }
                      placeholder="e.g. 4500000"
                      className="form-input"
                      required
                    />
                  </FormField>

                  <FormField label="Land extent / Property size">
                    <input
                      value={form.size}
                      onChange={(event) =>
                        setForm({ ...form, size: event.target.value })
                      }
                      placeholder="e.g. 15 perches or 2,000 sq ft"
                      className="form-input"
                      maxLength={100}
                    />
                  </FormField>

                  <FormField label="Property description">
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          description: event.target.value,
                        })
                      }
                      placeholder="Describe the property and nearby facilities..."
                      className="form-input min-h-[120px] resize-y"
                      maxLength={2000}
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      {form.description.length}/2000 characters
                    </p>
                  </FormField>
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {formError}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#00845f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#006d4f]"
                  >
                    {editingId !== null
                      ? "Save Changes"
                      : "Save as Draft"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelForm}
                    className="rounded-xl border border-[#dfe7f1] bg-white px-6 py-3 text-sm font-semibold text-[#172b45] transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Listings */}
          <section className="overflow-hidden rounded-3xl border border-[#e0e7f0] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#e0e7f0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#172b45]">
                  My Listings
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review and manage your properties.
                </p>
              </div>

              <div className="relative w-full sm:max-w-[275px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon name="search" size={19} />
                </span>

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search properties..."
                  aria-label="Search properties"
                  className="w-full rounded-2xl border border-[#dfe7f1] bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00845f] focus:ring-2 focus:ring-[#00845f]/10"
                />
              </div>
            </div>

            {/* Table for larger screens */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f9fc] text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-5 py-4">Property</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-5 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="border-t border-[#edf0f5] transition hover:bg-[#fbfcfe]"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <PropertyIcon />

                          <div className="min-w-0">
                            <p className="font-serif text-sm font-bold text-[#172b45]">
                              {property.title}
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <Icon name="location" size={14} />
                              {property.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5 text-sm text-slate-600">
                        {property.category}
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-sm font-bold text-[#172b45]">
                        {formatPrice(property.price)}
                      </td>

                      <td className="px-4 py-5">
                        <StatusBadge status={property.status} />
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center justify-center gap-1">
                          <ActionButton
                            label="View property"
                            onClick={() => setViewingProperty(property)}
                            icon="eye"
                          />

                          <ActionButton
                            label="Edit property"
                            onClick={() => openEditForm(property)}
                            icon="edit"
                          />

                          <ActionButton
                            label="Delete property"
                            onClick={() => deleteProperty(property.id)}
                            icon="trash"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards for mobile screens */}
            <div className="divide-y divide-[#edf0f5] md:hidden">
              {filteredProperties.map((property) => (
                <article key={property.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <PropertyIcon />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-sm font-bold text-[#172b45]">
                        {property.title}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Icon name="location" size={14} />
                        {property.location}
                      </p>

                      <p className="mt-3 text-sm font-bold">
                        {formatPrice(property.price)}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={property.status} />

                        <span className="text-xs text-slate-500">
                          {property.category}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-1">
                        <ActionButton
                          label="View property"
                          onClick={() => setViewingProperty(property)}
                          icon="eye"
                        />

                        <ActionButton
                          label="Edit property"
                          onClick={() => openEditForm(property)}
                          icon="edit"
                        />

                        <ActionButton
                          label="Delete property"
                          onClick={() => deleteProperty(property.id)}
                          icon="trash"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Icon name="search" size={23} />
                </div>

                <h3 className="font-semibold text-[#172b45]">
                  No properties found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try another search term or add a new property.
                </p>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-sm font-semibold text-[#00845f] hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="py-8 text-center text-xs text-slate-400">
            Plotora Seller Workspace · Frontend prototype
          </footer>
        </main>
      </div>

      {/* Property details modal */}
      {viewingProperty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewingProperty(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-details-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#00845f]">
                  Property details
                </p>

                <h2
                  id="property-details-title"
                  className="mt-2 font-serif text-xl font-bold text-[#172b45]"
                >
                  {viewingProperty.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setViewingProperty(null)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close property details"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl bg-[#eafbf3] p-5">
                <p className="text-sm text-slate-600">Asking price</p>

                <p className="mt-1 text-2xl font-bold text-[#00845f]">
                  {formatPrice(viewingProperty.price)}
                </p>
              </div>

              <DetailRow
                label="Location"
                value={viewingProperty.location}
              />

              <DetailRow
                label="Category"
                value={viewingProperty.category}
              />

              <DetailRow
                label="Property size"
                value={viewingProperty.size || "Not specified"}
              />

              <DetailRow
                label="Listing status"
                value={viewingProperty.status}
              />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {viewingProperty.description ||
                    "No description has been added."}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <label
                  htmlFor="listing-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Update listing status
                </label>

                <select
                  id="listing-status"
                  value={viewingProperty.status}
                  onChange={(event) => {
                    const status = event.target.value as PropertyStatus;

                    changeStatus(viewingProperty.id, status);

                    setViewingProperty({
                      ...viewingProperty,
                      status,
                    });
                  }}
                  className="form-input"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    openEditForm(viewingProperty);
                    setViewingProperty(null);
                  }}
                  className="rounded-xl bg-[#00845f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#006d4f]"
                >
                  Edit Property
                </button>

                <button
                  type="button"
                  onClick={() => setViewingProperty(null)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Component styles */}
      <style jsx global>{`
        .form-input {
          display: block;
          width: 100%;
          border: 1px solid #dfe7f1;
          border-radius: 14px;
          background: #ffffff;
          padding: 13px 15px;
          color: #172b45;
          font-size: 14px;
          outline: none;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: #00845f;
          box-shadow: 0 0 0 3px rgb(0 132 95 / 10%);
        }

        .form-input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-3xl border border-[#e0e7f0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e9faf3] text-[#00845f]">
        <Icon name={icon} size={23} />
      </div>

      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 break-words font-serif text-2xl font-bold text-[#172b45]">
        {value}
      </p>
    </article>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#172b45]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function PropertyIcon() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9faf3] text-[#00845f]">
      <Icon name="home" size={23} />
    </div>
  );
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const styles: Record<PropertyStatus, string> = {
    Active: "bg-[#e9faf3] text-[#00845f]",
    Pending: "bg-[#fff7e5] text-[#b96b00]",
    Draft: "bg-[#f0f4f8] text-[#52657d]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-lg p-2 text-slate-500 transition hover:bg-[#e9faf3] hover:text-[#00845f]"
    >
      <Icon name={icon} size={19} />
    </button>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-[#172b45]">
        {value}
      </span>
    </div>
  );
}

function formatCompactPrice(price: number) {
  if (price >= 1_000_000) {
    return `LKR ${(price / 1_000_000).toFixed(1)}M`;
  }

  return formatPrice(price);
}