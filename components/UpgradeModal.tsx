"use client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">免费额度已用完</h2>
          <p className="text-gray-500 mb-6">
            你已用完全部 3 次免费额度<br />
            升级套餐继续使用
          </p>

          <div className="space-y-3 mb-6">
            <div className="border-2 border-blue-500 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">积分包 · Starter</div>
                  <div className="text-sm text-gray-500">100 次处理</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">$1.99</div>
              </div>
            </div>
            
            <div className="border rounded-xl p-4 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">月订阅 · Basic</div>
                  <div className="text-sm text-gray-500">200 次/月</div>
                </div>
                <div className="text-2xl font-bold">
                  $2.99<span className="text-sm text-gray-500">/月</span>
                </div>
              </div>
            </div>
          </div>

          <button
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 mb-3 transition-colors"
            onClick={() => alert("支付功能即将上线！")}
          >
            立即升级
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
