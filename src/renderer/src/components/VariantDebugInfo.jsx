import React from 'react'

const VariantDebugInfo = ({
  newVariant,
  availableSizes,
  availableColors,
  session,
  currentSucursalId,
  formData
}) => {
  return (
    <div className="mb-4 rounded-lg bg-gray-100 p-4 text-xs">
      <h4 className="mb-2 font-bold">🔍 Debug Info - Variant Addition</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h5 className="font-semibold">Session Data:</h5>
          <pre className="rounded bg-white p-2 text-xs">
            {JSON.stringify(
              {
                storage_id: session?.storage_id,
                storage_name: session?.storage_name,
                currentSucursalId: currentSucursalId
              },
              null,
              2
            )}
          </pre>
        </div>

        <div>
          <h5 className="font-semibold">New Variant State:</h5>
          <pre className="rounded bg-white p-2 text-xs">{JSON.stringify(newVariant, null, 2)}</pre>
        </div>

        <div>
          <h5 className="font-semibold">Available Sizes ({availableSizes.length}):</h5>
          <pre className="max-h-32 overflow-y-auto rounded bg-white p-2 text-xs">
            {JSON.stringify(availableSizes.slice(0, 3), null, 2)}
            {availableSizes.length > 3 && `\n... and ${availableSizes.length - 3} more`}
          </pre>
        </div>

        <div>
          <h5 className="font-semibold">Available Colors ({availableColors.length}):</h5>
          <pre className="max-h-32 overflow-y-auto rounded bg-white p-2 text-xs">
            {JSON.stringify(availableColors.slice(0, 3), null, 2)}
            {availableColors.length > 3 && `\n... and ${availableColors.length - 3} more`}
          </pre>
        </div>

        <div className="md:col-span-2">
          <h5 className="font-semibold">
            Current Variants ({formData?.stock_variants?.length || 0}):
          </h5>
          <pre className="max-h-32 overflow-y-auto rounded bg-white p-2 text-xs">
            {JSON.stringify(formData?.stock_variants?.slice(0, 2) || [], null, 2)}
            {(formData?.stock_variants?.length || 0) > 2 &&
              `\n... and ${(formData?.stock_variants?.length || 0) - 2} more`}
          </pre>
        </div>
      </div>

      <div className="mt-2 text-sm">
        <h5 className="font-semibold">Validation Status:</h5>
        <ul className="list-inside list-disc text-xs">
          <li className={newVariant.size_id ? 'text-green-600' : 'text-red-600'}>
            Size ID: {newVariant.size_id || 'Not selected'}
          </li>
          <li className={newVariant.color_id ? 'text-green-600' : 'text-red-600'}>
            Color ID: {newVariant.color_id || 'Not selected'}
          </li>
          <li className={newVariant.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
            Quantity: {newVariant.quantity} {newVariant.quantity > 0 ? '✓' : '✗'}
          </li>
          <li className={currentSucursalId ? 'text-green-600' : 'text-red-600'}>
            Sucursal ID: {currentSucursalId || 'Not available'} {currentSucursalId ? '✓' : '✗'}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default VariantDebugInfo
