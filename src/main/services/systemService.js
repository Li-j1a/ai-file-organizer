const si = require('systeminformation')

class SystemService {
  async getSystemInfo() {
    const [cpu, mem, disk, os] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.osInfo()
    ])

    return {
      cpu: {
        model: cpu.brand,
        cores: cpu.cores,
        speed: cpu.speed
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free
      },
      disk: disk.map(d => ({
        fs: d.fs,
        size: d.size,
        used: d.used,
        available: d.available,
        use: d.use
      })),
      os: {
        platform: os.platform,
        distro: os.distro,
        release: os.release
      }
    }
  }

  async getStartupApps() {
    // Windows启动项检测
    return []
  }
}

module.exports = new SystemService()
