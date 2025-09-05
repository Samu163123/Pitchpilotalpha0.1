"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Plus, Sparkles, Check, CheckCircle, Loader2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProductSelectorProps {
  selectedProduct: Product | null
  onSelect: (product: Product) => void
  products: Product[]
}

export function ProductSelector({ selectedProduct, onSelect, products }: ProductSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const { toast } = useToast()

  const handleCustomProduct = () => {
    if (customName.trim() && customDescription.trim()) {
      const customProduct: Product = {
        id: "custom-" + Date.now(),
        name: customName.trim(),
        description: customDescription.trim(),
      }
      onSelect(customProduct)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4">
          <Package className="w-4 h-4" />
          <span className="text-sm font-medium">Product Selection</span>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">What are you selling?</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose a sample product or describe your own</p>
      </div>

      <div className="grid gap-6">
        {/* Default Products */}
        {products.map((product) => (
          <Card
            key={product.id}
            className={`selection-card cursor-pointer transition-all duration-300 shadow-modern ${
              selectedProduct?.id === product.id
                ? "selected ring-2 ring-emerald-500 scale-[1.01]"
                : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
            }`}
            onClick={() => onSelect(product)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      selectedProduct?.id === product.id
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg animate-scale-in"
                        : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                    }`}
                  >
                    {selectedProduct?.id === product.id ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">{product.name}</CardTitle>
                </div>
                {selectedProduct?.id === product.id && (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-scale-in">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
        ))}

        {/* Custom Product Option */}
        {!showCustom ? (
          <Card
            className="selection-card cursor-pointer transition-all duration-300 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10"
            onClick={() => setShowCustom(true)}
          >
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300">
                  <Plus className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Custom Product</h3>
                <p className="text-gray-600 dark:text-gray-400">Describe your own product or service</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 shadow-modern">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Custom Product</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="product-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g., CRM Software, Marketing Services..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="product-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!customName.trim() || aiLoading}
                    onClick={async () => {
                      if (!customName.trim()) return
                      setAiLoading(true)
                      try {
                        const res = await fetch("/api/ai/generate-description", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ productName: customName })
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data?.error || "Failed to generate")
                        setCustomDescription(data.description)
                        toast({ title: "Description generated", description: "You can edit it before proceeding." })
                      } catch (err: any) {
                        toast({ variant: "destructive", title: "Generation failed", description: String(err?.message || err) })
                      } finally {
                        setAiLoading(false)
                      }
                    }}
                    className="gap-2"
                    aria-label="Generate description with AI"
                    title="Generate description with AI"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate with AI
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  id="product-description"
                  placeholder="Describe your product, key features, and benefits..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={4}
                  className="mt-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleCustomProduct}
                  disabled={!customName.trim() || !customDescription.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  Use This Product
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustom(false)
                    setCustomName("")
                    setCustomDescription("")
                  }}
                  className="bg-white dark:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
