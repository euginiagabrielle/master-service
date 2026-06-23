export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
