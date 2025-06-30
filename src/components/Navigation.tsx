import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useWallet } from '@/contexts/WalletContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { NetworkSelector } from '@/components/NetworkSelector';
import { EnvironmentValidator } from '@/components/EnvironmentValidator';
import {
  Home,
  Plus,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  Wallet,
  LogOut,
  Zap
} from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, publicKey, connect, disconnect } = useWallet();
  const { currentNetwork, networkConfig } = useNetwork();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresWallet: true },
    { path: '/create-contract', label: 'Create Contract', icon: Plus },
    { path: '/websocket-demo', label: 'WebSocket Demo', icon: Zap },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleWalletAction = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatPublicKey = (key: string) => {
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <img
                src="/logo.svg"
                alt="SecureContract Pro"
                className="h-8 w-8"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'block';
                }}
              />
              <div className="bg-blue-600 p-2 rounded-lg h-8 w-8 hidden">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">SecureContract Pro</span>
          </div>

          {/* Environment Validator */}
          <div className="hidden lg:block">
            <EnvironmentValidator />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              const isDisabled = item.requiresWallet && !connected;

              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => {
                    if (!isDisabled) {
                      navigate(item.path);
                    }
                  }}
                  disabled={isDisabled}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Network Selector */}
          <div className="hidden md:flex">
            <NetworkSelector />
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-3">
            {connected && publicKey ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-slate-300">
                  <div className="font-medium">Connected</div>
                  <div className="text-xs text-slate-400">
                    {formatPublicKey(publicKey.toString())}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWalletAction}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleWalletAction}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                const isDisabled = item.requiresWallet && !connected;

                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => {
                      if (!isDisabled) {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                      w-full justify-start flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              
              {/* Mobile Wallet Connection */}
              <div className="pt-4 border-t border-slate-700">
                {connected && publicKey ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2 text-sm text-slate-300">
                      <div className="font-medium">Connected</div>
                      <div className="text-xs text-slate-400">
                        {formatPublicKey(publicKey.toString())}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleWalletAction();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      handleWalletAction();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
