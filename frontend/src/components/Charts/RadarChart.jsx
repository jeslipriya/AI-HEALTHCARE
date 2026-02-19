import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = ({ data: metricsData }) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState(null);

  // Define optimal ranges for different demographics
  const getOptimalRanges = () => {
    const age = user?.profile?.age || 30;
    const gender = user?.profile?.gender || 'female';

    // Base optimal values (percentage of goal achieved)
    const baseRanges = {
      fitness: 80, // 80% of daily step goal
      nutrition: 75, // 75% of nutritional targets
      mental: 70, // 70% optimal mental wellness
      sleep: 85, // 85% of optimal sleep (7-9 hours)
      hydration: 80, // 80% of daily water intake
      medication: 100 // 100% medication adherence
    };

    // Adjust based on age
    if (age < 30) {
      baseRanges.fitness += 10;
      baseRanges.sleep -= 5;
    } else if (age > 50) {
      baseRanges.fitness -= 10;
      baseRanges.mental += 10;
      baseRanges.hydration += 5;
    }

    // Adjust based on gender
    if (gender === 'female') {
      baseRanges.hydration -= 5;
      baseRanges.mental += 5;
    } else if (gender === 'male') {
      baseRanges.fitness += 5;
      baseRanges.nutrition += 5;
    }

    // Cap values between 0 and 100
    Object.keys(baseRanges).forEach(key => {
      baseRanges[key] = Math.min(100, Math.max(0, baseRanges[key]));
    });

    return baseRanges;
  };

  useEffect(() => {
    if (metricsData) {
      // Get optimal ranges based on user profile
      const optimalRanges = getOptimalRanges();

      // Prepare chart data with actual user metrics vs optimal ranges
      const data = {
        labels: [
          'Physical Fitness',
          'Nutrition',
          'Mental Wellness',
          'Sleep Quality',
          'Hydration',
          'Medication Adherence'
        ],
        datasets: [
          {
            label: 'Your Current Metrics',
            data: [
              metricsData.fitness || 0,
              metricsData.nutrition || 0,
              metricsData.mental || 0,
              metricsData.sleep || 0,
              metricsData.hydration || 0,
              metricsData.medication || 0
            ],
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            borderColor: 'rgba(14, 165, 233, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(14, 165, 233, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(14, 165, 233, 1)'
          },
          {
            label: 'Optimal Range',
            data: [
              optimalRanges.fitness,
              optimalRanges.nutrition,
              optimalRanges.mental,
              optimalRanges.sleep,
              optimalRanges.hydration,
              optimalRanges.medication
            ],
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            borderColor: 'rgba(156, 163, 175, 0.5)',
            borderWidth: 1,
            pointBackgroundColor: 'rgba(156, 163, 175, 0.5)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(156, 163, 175, 0.5)',
            borderDash: [5, 5]
          }
        ]
      };

      setChartData(data);
    }
  }, [metricsData, user]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#4B5563'
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.backgroundColor,
              strokeStyle: dataset.borderColor,
              lineWidth: dataset.borderWidth,
              hidden: !chart.isDatasetVisible(i),
              index: i
            }));
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.r !== undefined) {
              label += Math.round(context.parsed.r) + '%';
            }
            return label;
          },
          afterLabel: function(context) {
            if (context.datasetIndex === 0) {
              const metric = context.label;
              const value = context.parsed.r;
              const optimal = context.chart.data.datasets[1].data[context.dataIndex];
              
              if (value < optimal) {
                return `⚠️ ${Math.round(optimal - value)}% below optimal`;
              } else if (value > optimal) {
                return `✨ ${Math.round(value - optimal)}% above optimal`;
              }
              return '✅ At optimal level';
            }
            return null;
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  if (!chartData) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full relative">
      <Radar data={chartData} options={options} />
      
      {/* Legend Note */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-400 mt-2">
        * Optimal ranges adjusted for your age and gender
      </div>
    </div>
  );
};

export default RadarChart;