export default function NovoUsuarioLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Breadcrumb + Title */}
      <div>
        <div className="h-4 w-20 rounded skeleton" />
        <div className="mt-2 h-8 w-36 rounded skeleton" />
      </div>

      {/* Form card */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {/* Clínica */}
        <div className="space-y-2">
          <div className="h-4 w-16 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <div className="h-4 w-14 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <div className="h-4 w-14 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* Papel */}
        <div className="space-y-2">
          <div className="h-4 w-12 rounded skeleton" />
          <div className="h-10 w-full rounded-lg skeleton" />
        </div>

        {/* Submit button */}
        <div className="h-10 w-32 rounded-lg skeleton" />
      </div>
    </div>
  );
}
