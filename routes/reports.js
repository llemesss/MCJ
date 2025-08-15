const express = require('express');
const Schedule = require('../models/Schedule');
const Song = require('../models/Song');
const Ministry = require('../models/Ministry');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/reports/ministry/:ministryId/member-participation
// @desc    Get member participation report
// @access  Private
router.get('/ministry/:ministryId/member-participation', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { startDate, endDate, period = '3months' } = req.query;

    // Check if user is member of the ministry
    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    const isMember = ministry.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const now = new Date();
      let monthsBack = 3;
      
      switch (period) {
        case '1month': monthsBack = 1; break;
        case '6months': monthsBack = 6; break;
        case '1year': monthsBack = 12; break;
        default: monthsBack = 3;
      }
      
      dateFilter = {
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
        }
      };
    }

    // Get schedules in date range
    const schedules = await Schedule.find({
      ministry: ministryId,
      status: { $in: ['published', 'completed'] },
      ...dateFilter
    }).populate('members.user', 'name email avatar');

    // Calculate participation stats
    const memberStats = {};
    
    ministry.members.forEach(member => {
      memberStats[member.user.toString()] = {
        user: member.user,
        totalScheduled: 0,
        totalConfirmed: 0,
        totalPresent: 0,
        instruments: {},
        participationRate: 0,
        confirmationRate: 0,
        attendanceRate: 0
      };
    });

    schedules.forEach(schedule => {
      schedule.members.forEach(member => {
        const userId = member.user._id.toString();
        if (memberStats[userId]) {
          memberStats[userId].totalScheduled++;
          
          if (member.confirmed === 'confirmed') {
            memberStats[userId].totalConfirmed++;
          }
          
          // Count instrument usage
          if (!memberStats[userId].instruments[member.instrument]) {
            memberStats[userId].instruments[member.instrument] = 0;
          }
          memberStats[userId].instruments[member.instrument]++;
        }
      });
      
      // Check attendance
      schedule.attendance.forEach(att => {
        const userId = att.user.toString();
        if (memberStats[userId] && att.present) {
          memberStats[userId].totalPresent++;
        }
      });
    });

    // Calculate rates
    Object.keys(memberStats).forEach(userId => {
      const stats = memberStats[userId];
      const totalSchedules = schedules.length;
      
      stats.participationRate = totalSchedules > 0 ? 
        (stats.totalScheduled / totalSchedules * 100).toFixed(1) : 0;
      
      stats.confirmationRate = stats.totalScheduled > 0 ? 
        (stats.totalConfirmed / stats.totalScheduled * 100).toFixed(1) : 0;
      
      stats.attendanceRate = stats.totalScheduled > 0 ? 
        (stats.totalPresent / stats.totalScheduled * 100).toFixed(1) : 0;
    });

    // Populate user data
    await Ministry.populate(ministry, {
      path: 'members.user',
      select: 'name email avatar'
    });

    const report = Object.values(memberStats).map(stats => ({
      ...stats,
      user: ministry.members.find(m => m.user._id.toString() === stats.user.toString())?.user
    }));

    res.json({
      period: { startDate, endDate, period },
      totalSchedules: schedules.length,
      memberStats: report.sort((a, b) => b.participationRate - a.participationRate)
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/reports/ministry/:ministryId/song-usage
// @desc    Get song usage report
// @access  Private
router.get('/ministry/:ministryId/song-usage', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { startDate, endDate, limit = 20 } = req.query;

    // Check if user is member of the ministry
    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    const isMember = ministry.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get schedules with songs
    const schedules = await Schedule.find({
      ministry: ministryId,
      status: { $in: ['published', 'completed'] },
      ...dateFilter
    }).populate('songs.song', 'title artist genre');

    // Count song usage
    const songUsage = {};
    
    schedules.forEach(schedule => {
      schedule.songs.forEach(songEntry => {
        if (songEntry.song) {
          const songId = songEntry.song._id.toString();
          if (!songUsage[songId]) {
            songUsage[songId] = {
              song: songEntry.song,
              timesUsed: 0,
              lastUsed: null,
              schedules: []
            };
          }
          songUsage[songId].timesUsed++;
          songUsage[songId].schedules.push({
            title: schedule.title,
            date: schedule.date,
            key: songEntry.key
          });
          
          if (!songUsage[songId].lastUsed || schedule.date > songUsage[songId].lastUsed) {
            songUsage[songId].lastUsed = schedule.date;
          }
        }
      });
    });

    // Sort by usage and limit
    const sortedSongs = Object.values(songUsage)
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, limit);

    // Get songs that haven't been used
    const usedSongIds = Object.keys(songUsage);
    const unusedSongs = await Song.find({
      ministry: ministryId,
      isActive: true,
      _id: { $nin: usedSongIds }
    }).select('title artist genre createdAt');

    res.json({
      period: { startDate, endDate },
      totalSchedules: schedules.length,
      mostUsedSongs: sortedSongs,
      unusedSongs: unusedSongs.slice(0, 10),
      totalSongs: await Song.countDocuments({ ministry: ministryId, isActive: true }),
      usageStats: {
        totalUsedSongs: Object.keys(songUsage).length,
        averageUsagePerSong: Object.keys(songUsage).length > 0 ? 
          (Object.values(songUsage).reduce((sum, s) => sum + s.timesUsed, 0) / Object.keys(songUsage).length).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/reports/ministry/:ministryId/schedule-overview
// @desc    Get schedule overview report
// @access  Private
router.get('/ministry/:ministryId/schedule-overview', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    // Check if user is member of the ministry
    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    const isMember = ministry.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Get schedules for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const schedules = await Schedule.find({
      ministry: ministryId,
      date: {
        $gte: startOfYear,
        $lte: endOfYear
      }
    }).populate('members.user', 'name')
      .populate('createdBy', 'name');

    // Group by month
    const monthlyStats = {};
    for (let i = 0; i < 12; i++) {
      monthlyStats[i] = {
        month: i,
        totalSchedules: 0,
        byType: {},
        byStatus: {},
        averageMembers: 0
      };
    }

    schedules.forEach(schedule => {
      const month = schedule.date.getMonth();
      const stats = monthlyStats[month];
      
      stats.totalSchedules++;
      
      // Count by type
      if (!stats.byType[schedule.type]) {
        stats.byType[schedule.type] = 0;
      }
      stats.byType[schedule.type]++;
      
      // Count by status
      if (!stats.byStatus[schedule.status]) {
        stats.byStatus[schedule.status] = 0;
      }
      stats.byStatus[schedule.status]++;
      
      // Add member count for average calculation
      stats.averageMembers += schedule.members.length;
    });

    // Calculate averages
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      if (stats.totalSchedules > 0) {
        stats.averageMembers = (stats.averageMembers / stats.totalSchedules).toFixed(1);
      }
    });

    // Overall stats
    const totalSchedules = schedules.length;
    const byType = {};
    const byStatus = {};
    
    schedules.forEach(schedule => {
      if (!byType[schedule.type]) byType[schedule.type] = 0;
      if (!byStatus[schedule.status]) byStatus[schedule.status] = 0;
      
      byType[schedule.type]++;
      byStatus[schedule.status]++;
    });

    // Upcoming schedules
    const now = new Date();
    const upcomingSchedules = await Schedule.find({
      ministry: ministryId,
      date: { $gte: now },
      status: { $in: ['draft', 'published'] }
    }).populate('members.user', 'name')
      .sort({ date: 1 })
      .limit(5);

    res.json({
      year: parseInt(year),
      totalSchedules,
      byType,
      byStatus,
      monthlyStats: Object.values(monthlyStats),
      upcomingSchedules,
      averageMembersPerSchedule: totalSchedules > 0 ? 
        (schedules.reduce((sum, s) => sum + s.members.length, 0) / totalSchedules).toFixed(1) : 0
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/reports/ministry/:ministryId/attendance
// @desc    Get attendance report
// @access  Private
router.get('/ministry/:ministryId/attendance', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { startDate, endDate, memberId } = req.query;

    // Check if user is admin or leader
    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get completed schedules with attendance
    const schedules = await Schedule.find({
      ministry: ministryId,
      status: 'completed',
      ...dateFilter
    }).populate('attendance.user', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Calculate attendance stats
    const attendanceStats = {};
    
    schedules.forEach(schedule => {
      schedule.members.forEach(member => {
        const userId = member.user._id.toString();
        
        if (!attendanceStats[userId]) {
          attendanceStats[userId] = {
            user: member.user,
            totalScheduled: 0,
            totalPresent: 0,
            totalAbsent: 0,
            attendanceRate: 0,
            absences: []
          };
        }
        
        attendanceStats[userId].totalScheduled++;
        
        const attendance = schedule.attendance.find(att => 
          att.user._id.toString() === userId
        );
        
        if (attendance && attendance.present) {
          attendanceStats[userId].totalPresent++;
        } else {
          attendanceStats[userId].totalAbsent++;
          attendanceStats[userId].absences.push({
            schedule: {
              title: schedule.title,
              date: schedule.date
            },
            notes: attendance?.notes || ''
          });
        }
      });
    });

    // Calculate attendance rates
    Object.keys(attendanceStats).forEach(userId => {
      const stats = attendanceStats[userId];
      stats.attendanceRate = stats.totalScheduled > 0 ? 
        (stats.totalPresent / stats.totalScheduled * 100).toFixed(1) : 0;
    });

    // Filter by specific member if requested
    let result = Object.values(attendanceStats);
    if (memberId) {
      result = result.filter(stats => stats.user._id.toString() === memberId);
    }

    res.json({
      period: { startDate, endDate },
      totalSchedules: schedules.length,
      attendanceStats: result.sort((a, b) => b.attendanceRate - a.attendanceRate),
      overallStats: {
        averageAttendanceRate: result.length > 0 ? 
          (result.reduce((sum, s) => sum + parseFloat(s.attendanceRate), 0) / result.length).toFixed(1) : 0,
        totalAbsences: result.reduce((sum, s) => sum + s.totalAbsent, 0)
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

module.exports = router;