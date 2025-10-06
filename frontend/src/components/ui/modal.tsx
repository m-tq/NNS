import { X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  status: 'pending' | 'success' | 'error'
  hash?: string
  message?: string
  explorerUrl?: string
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  status, 
  hash, 
  message,
  explorerUrl 
}: TransactionModalProps) {
  if (!isOpen) return null

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending'
      case 'success':
        return 'Transaction Successful'
      case 'error':
        return 'Transaction Failed'
    }
  }

  const getStatusMessage = () => {
    if (message) return message
    
    switch (status) {
      case 'pending':
        return 'Please wait while your transaction is being processed...'
      case 'success':
        return 'Your domain has been successfully registered!'
      case 'error':
        return 'There was an error processing your transaction. Please try again.'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            {getStatusTitle()}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            {getStatusMessage()}
          </p>

          {hash && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Transaction Hash:</p>
              <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                {hash}
              </div>
              {explorerUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`${explorerUrl}/tx/${hash}`, '_blank')}
                >
                  View on Explorer
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} className="w-full">
              {status === 'pending' ? 'Close' : 'OK'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}