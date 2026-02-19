class HealthScoreService {
  calculateHealthScore(user, data) {
    const scores = {
      fitness: this.calcFitness(user, data),
      nutrition: this.calcNutrition(user, data),
      mental: this.calcMental(user, data),
      sleep: this.calcSleep(user, data),
      hydration: this.calcHydration(user, data),
      medication: this.calcMedication(user, data)
    };

    const weights = [0.2, 0.2, 0.15, 0.15, 0.15, 0.15];
    const total = Math.round(Object.values(scores).reduce((sum, score, i) => sum + score * weights[i], 0));
    
    return {
      total,
      components: scores,
      trend: this.calcTrend(data),
      recommendations: Object.entries(scores).reduce((recs, [key, val]) => 
        val < 60 ? [...recs, {
          fitness: 'Increase daily physical activity',
          nutrition: 'Focus on balanced meals',
          sleep: 'Maintain consistent sleep schedule',
          mental: 'Practice mindfulness daily',
          hydration: 'Drink more water',
          medication: 'Check medication adherence'
        }[key]] : recs, [])
    };
  }

  calcFitness(user, data) {
    const activities = data?.filter(d => d.type === 'activity') || [];
    if (!activities.length) return 50;
    
    const avg = activities.reduce((s, d) => s + (d.data.duration || 0), 0) / activities.length;
    const target = user?.goals?.find(g => g.category === 'fitness')?.target || 30;
    return Math.min(100, (avg / target) * 100);
  }

  calcNutrition(user, data) {
    const nutrition = data?.filter(d => d.type === 'nutrition') || [];
    if (!nutrition.length) return 50;
    
    const water = nutrition.reduce((s, d) => s + (d.data.water || 0), 0);
    return Math.min(100, (water / 8) * 100);
  }

  calcMental(user, data) {
    const mental = data?.filter(d => d.type === 'mental') || [];
    if (!mental.length) return 50;
    
    const mood = mental.reduce((s, d) => s + (d.data.mood || 5), 0) / mental.length;
    return (mood / 10) * 100;
  }

  calcSleep(user, data) {
    const sleep = data?.filter(d => d.type === 'sleep') || [];
    if (!sleep.length) return 50;
    
    const hours = sleep.reduce((s, d) => s + (d.data.hours || 0), 0) / sleep.length;
    return Math.min(100, (hours / 8) * 100);
  }

  calcHydration(user, data) {
    const hydration = data?.filter(d => d.type === 'hydration') || [];
    if (!hydration.length) return 50;
    
    const avg = hydration.reduce((s, d) => s + (d.data.amount || 0), 0) / hydration.length;
    const target = user?.profile?.weight ? user.profile.weight * 0.03 : 2.5;
    return Math.min(100, (avg / target) * 100);
  }

  calcMedication(user, data) {
    const meds = data?.filter(d => d.type === 'medication') || [];
    if (!meds.length) return 100;
    
    return meds.reduce((s, d) => s + (d.data.taken ? 1 : 0), 0) / meds.length * 100;
  }

  calcTrend(data) {
    const now = new Date();
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    
    const recent = data?.filter(d => new Date(d.timestamp) > weekAgo) || [];
    const older = data?.filter(d => new Date(d.timestamp) <= weekAgo) || [];
    
    const getAvg = items => Object.values({
      fitness: this.calcFitness(null, items),
      nutrition: this.calcNutrition(null, items),
      mental: this.calcMental(null, items),
      sleep: this.calcSleep(null, items),
      hydration: this.calcHydration(null, items),
      medication: this.calcMedication(null, items)
    }).reduce((s, v, i) => s + v * [0.2, 0.2, 0.15, 0.15, 0.15, 0.15][i], 0);

    const recentAvg = getAvg(recent);
    const olderAvg = getAvg(older);
    
    return {
      direction: recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable',
      change: Math.abs(recentAvg - olderAvg).toFixed(1)
    };
  }
}

module.exports = new HealthScoreService();