
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ContractStat {
  id: string;
  contractType: string;
  parties: number;
  value: string;
  status: "Active" | "Completed" | "Pending";
  timestamp: string;
  trend: "up" | "down";
  change: string;
}

const generateRandomStat = (): ContractStat => {
  const contractTypes = ["Supply Agreement", "Service Contract", "Partnership Deal", "License Agreement", "Distribution Contract"];
  const statuses: ContractStat["status"][] = ["Active", "Completed", "Pending"];
  const trends: ContractStat["trend"][] = ["up", "down"];
  
  const randomValue = Math.floor(Math.random() * 500000) + 10000;
  const randomChange = Math.floor(Math.random() * 20) + 1;
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    contractType: contractTypes[Math.floor(Math.random() * contractTypes.length)],
    parties: Math.floor(Math.random() * 5) + 2,
    value: `$${randomValue.toLocaleString()}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    timestamp: new Date().toLocaleTimeString(),
    trend: trends[Math.floor(Math.random() * trends.length)],
    change: `${randomChange}%`
  };
};

export const DynamicStatsTable = () => {
  const [stats, setStats] = useState<ContractStat[]>([]);
  const [totalContracts, setTotalContracts] = useState(1247);
  const [totalParties, setTotalParties] = useState(3891);
  const [totalValue, setTotalValue] = useState(15420000);

  useEffect(() => {
    // Initialize with some data
    const initialStats = Array.from({ length: 8 }, generateRandomStat);
    setStats(initialStats);

    // Update stats every 3 seconds
    const interval = setInterval(() => {
      setStats(prevStats => {
        const newStats = [...prevStats];
        
        // Update a random existing stat or add a new one
        if (Math.random() > 0.3 && newStats.length > 0) {
          const randomIndex = Math.floor(Math.random() * newStats.length);
          newStats[randomIndex] = { ...newStats[randomIndex], ...generateRandomStat() };
        } else {
          // Add new stat and remove oldest if we have too many
          newStats.unshift(generateRandomStat());
          if (newStats.length > 10) {
            newStats.pop();
          }
        }
        
        return newStats;
      });

      // Update totals
      setTotalContracts(prev => prev + Math.floor(Math.random() * 3));
      setTotalParties(prev => prev + Math.floor(Math.random() * 5));
      setTotalValue(prev => prev + Math.floor(Math.random() * 50000));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ContractStat["status"]) => {
    switch (status) {
      case "Active": return "text-green-400";
      case "Completed": return "text-blue-400";
      case "Pending": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  return (
    <section className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-sm" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Live Contract
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400"> Analytics</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Real-time insights into contract activity on our platform
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm font-medium">Total Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalContracts.toLocaleString()}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% from last hour
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm font-medium">Active Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalParties.toLocaleString()}</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8% from last hour
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm font-medium">Total Contract Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">${(totalValue / 1000000).toFixed(1)}M</div>
              <div className="flex items-center text-green-400 text-sm mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +15% from last hour
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Table */}
        <Card className="bg-white/5 backdrop-blur-md border border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-xl">Recent Contract Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-300 font-semibold">Contract Type</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Parties</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Value</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Change</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow 
                    key={stat.id} 
                    className="border-white/10 hover:bg-white/5 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-white">{stat.contractType}</TableCell>
                    <TableCell className="text-gray-300">{stat.parties}</TableCell>
                    <TableCell className="text-gray-300 font-medium">{stat.value}</TableCell>
                    <TableCell className={`font-medium ${getStatusColor(stat.status)}`}>
                      {stat.status}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className={`flex items-center ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.trend === 'up' ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        {stat.change}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">{stat.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="inline-flex items-center text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live data • Updates every 3 seconds
          </div>
        </div>
      </div>
    </section>
  );
};
