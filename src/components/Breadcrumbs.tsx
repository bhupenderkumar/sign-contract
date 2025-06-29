import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label = segment;
      
      // Custom labels for known routes
      switch (segment) {
        case 'create-contract':
          label = 'Create Contract';
          break;
        case 'dashboard':
          label = 'Dashboard';
          break;
        case 'contract':
          label = 'Contract Details';
          break;
        default:
          // For dynamic segments like contract IDs, keep them as is but truncate if too long
          if (segment.length > 10) {
            label = `${segment.slice(0, 8)}...`;
          }
          break;
      }

      breadcrumbs.push({
        label,
        path: currentPath,
        isActive: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs for home page only
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(item.path)}
            disabled={item.isActive}
            className={`
              h-auto p-1 font-normal
              ${item.isActive 
                ? 'text-white cursor-default' 
                : 'text-slate-400 hover:text-white'
              }
            `}
          >
            {index === 0 && <Home className="h-3 w-3 mr-1" />}
            {item.label}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
