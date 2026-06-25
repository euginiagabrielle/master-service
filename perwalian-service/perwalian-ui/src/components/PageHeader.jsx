export default function PageHeader({ title, description, action }) {
  return (
    <div className="rounded-xl px-6 py-5 mb-6 text-white shadow-sm bg-gradient-to-br from-blue-700 to-blue-500 flex justify-between items-start gap-4">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-sm text-blue-100 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
