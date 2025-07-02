import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Loader2, AlertCircle, Link, Database, Shield, Zap } from 'lucide-react';

interface DeploymentStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  duration?: number; // in milliseconds
}

interface DeploymentLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
  contractId?: string;
}

const DeploymentLoader: React.FC<DeploymentLoaderProps> = ({
  isVisible,
  onComplete,
  onError,
  contractId
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stages, setStages] = useState<DeploymentStage[]>([
    {
      id: 'wallet-connection',
      title: 'Connecting to Wallet',
      description: 'Establishing secure connection with your wallet',
      icon: <Shield className="h-5 w-5" />,
      status: 'pending',
      duration: 2000
    },
    {
      id: 'contract-validation',
      title: 'Validating Contract',
      description: 'Verifying contract data and structure',
      icon: <CheckCircle className="h-5 w-5" />,
      status: 'pending',
      duration: 1500
    },
    {
      id: 'ipfs-upload',
      title: 'Uploading to IPFS',
      description: 'Storing contract data on decentralized storage',
      icon: <Database className="h-5 w-5" />,
      status: 'pending',
      duration: 3000
    },
    {
      id: 'blockchain-deploy',
      title: 'Deploying to Blockchain',
      description: 'Creating contract on Solana network',
      icon: <Link className="h-5 w-5" />,
      status: 'pending',
      duration: 4000
    },
    {
      id: 'network-confirmation',
      title: 'Network Confirmation',
      description: 'Waiting for blockchain confirmation',
      icon: <Zap className="h-5 w-5" />,
      status: 'pending',
      duration: 2500
    }
  ]);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when loader is hidden
      setCurrentStageIndex(0);
      setProgress(0);
      setStages(prev => prev.map(stage => ({ ...stage, status: 'pending' })));
      return;
    }

    // Start the deployment process
    processStages();
  }, [isVisible]);

  const processStages = async () => {
    for (let i = 0; i < stages.length; i++) {
      setCurrentStageIndex(i);
      
      // Update current stage to in-progress
      setStages(prev => prev.map((stage, index) => ({
        ...stage,
        status: index === i ? 'in-progress' : index < i ? 'completed' : 'pending'
      })));

      // Simulate stage processing
      const stage = stages[i];
      const duration = stage.duration || 2000;
      
      // Animate progress for current stage
      const startTime = Date.now();
      const baseProgress = (i / stages.length) * 100;
      const stageProgress = 100 / stages.length;

      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const stageCompletion = Math.min(elapsed / duration, 1);
        const currentProgress = baseProgress + (stageProgress * stageCompletion);
        
        setProgress(currentProgress);

        if (stageCompletion < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      animateProgress();

      // Wait for stage to complete
      await new Promise(resolve => setTimeout(resolve, duration));

      // Mark stage as completed
      setStages(prev => prev.map((stage, index) => ({
        ...stage,
        status: index <= i ? 'completed' : 'pending'
      })));

      // Small delay between stages
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // All stages completed
    setProgress(100);
    setTimeout(() => {
      onComplete?.();
    }, 1000);
  };

  const getStageIcon = (stage: DeploymentStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-slate-400" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Link className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Deploying to Blockchain
          </h2>
          <p className="text-slate-400">
            Your contract is being deployed to the Solana network
          </p>
          {contractId && (
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Contract ID: {contractId}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-slate-800"
          />
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div 
              key={stage.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
                stage.status === 'in-progress' 
                  ? 'bg-blue-600/10 border border-blue-600/20' 
                  : stage.status === 'completed'
                  ? 'bg-green-600/10 border border-green-600/20'
                  : 'bg-slate-800/50'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStageIcon(stage)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${
                  stage.status === 'completed' ? 'text-green-400' :
                  stage.status === 'in-progress' ? 'text-blue-400' :
                  'text-slate-300'
                }`}>
                  {stage.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Powered by Solana Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentLoader;
