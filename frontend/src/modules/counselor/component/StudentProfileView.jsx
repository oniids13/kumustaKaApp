import React from "react";
import {
  Modal,
  Descriptions,
  Avatar,
  Tag,
  Badge,
  Card,
  List,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Empty,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  HeartOutlined,
  TrophyOutlined,
  FileTextOutlined,
  AlertOutlined,
  BookOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Title, Text } = Typography;

const StudentProfileView = ({ visible, onClose, studentProfile, loading }) => {
  if (!studentProfile) {
    return (
      <Modal
        title="Student Profile"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        loading={loading}
      >
        <Empty description="No student data available" />
      </Modal>
    );
  }

  const getStatusColor = (status) => {
    return status === "ACTIVE" ? "success" : "default";
  };

  const getZoneColor = (zone) => {
    switch (zone?.toLowerCase()) {
      case "green":
        return "success";
      case "yellow":
        return "warning";
      case "red":
        return "error";
      default:
        return "default";
    }
  };

  const getMoodColor = (moodLevel) => {
    if (moodLevel >= 4) return "success";
    if (moodLevel >= 2) return "warning";
    return "error";
  };

  const renderBasicInfo = () => (
    <Card title="Basic Information" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={4}>
          <Avatar
            size={80}
            src={studentProfile.user.avatar}
            icon={<UserOutlined />}
            style={{
              backgroundColor: studentProfile.user.avatar
                ? "transparent"
                : "#722ed1",
            }}
          />
        </Col>
        <Col span={20}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Full Name">
              <Text strong>
                {studentProfile.user.firstName} {studentProfile.user.lastName}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              <Space>
                <MailOutlined />
                {studentProfile.user.email}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <Space>
                <PhoneOutlined />
                {studentProfile.user.phone || "Not provided"}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                status={getStatusColor(studentProfile.user.status)}
                text={studentProfile.user.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Student Since">
              <Space>
                <CalendarOutlined />
                {moment(studentProfile.user.createdAt).format("MMM DD, YYYY")}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {studentProfile.user.lastLogin
                ? moment(studentProfile.user.lastLogin).format(
                    "MMM DD, YYYY HH:mm"
                  )
                : "Never logged in"}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {moment(studentProfile.user.updatedAt).format(
                "MMM DD, YYYY HH:mm"
              )}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );

  const renderEmergencyContacts = () => {
    if (!studentProfile.emergencyContacts?.length) {
      return (
        <Card title="Emergency Contacts" style={{ marginBottom: 16 }}>
          <Empty description="No emergency contacts added" />
        </Card>
      );
    }

    return (
      <Card title="Emergency Contacts" style={{ marginBottom: 16 }}>
        <List
          dataSource={studentProfile.emergencyContacts}
          renderItem={(contact) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: contact.isPrimary
                        ? "#52c41a"
                        : "#1890ff",
                    }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{contact.name}</Text>
                    {contact.isPrimary && (
                      <Tag color="green" size="small">
                        Primary
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">
                      Relationship: {contact.relationship}
                    </Text>
                    <Space>
                      <PhoneOutlined />
                      <Text>{contact.phone}</Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderStudentAnalytics = () => {
    const completedGoals =
      studentProfile.goals?.filter((goal) => goal.isCompleted).length || 0;
    const totalGoals = studentProfile.goals?.length || 0;
    const goalCompletionRate =
      totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const latestSurvey = studentProfile.surveys?.[0];
    const latestMoodEntry = studentProfile.moodEntries?.[0];
    const initialAssessment = studentProfile.initialAssessment;

    return (
      <Card title="Mental Health Analytics" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Goals Completed"
              value={completedGoals}
              suffix={`/ ${totalGoals}`}
              prefix={<TrophyOutlined />}
            />
            <Progress
              percent={Math.round(goalCompletionRate)}
              size="small"
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Survey Responses"
              value={studentProfile.surveys?.length || 0}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Mood Entries"
              value={studentProfile.moodEntries?.length || 0}
              prefix={<HeartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Latest Mood"
              value={latestMoodEntry?.moodLevel || "N/A"}
              suffix="/ 5"
              prefix={<HeartOutlined />}
              valueStyle={{
                color: latestMoodEntry
                  ? getMoodColor(latestMoodEntry.moodLevel) === "success"
                    ? "#52c41a"
                    : getMoodColor(latestMoodEntry.moodLevel) === "warning"
                    ? "#faad14"
                    : "#f5222d"
                  : undefined,
              }}
            />
          </Col>
        </Row>

        {latestSurvey && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left" orientationMargin="0">
              Latest Survey Result
            </Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Text type="secondary">Score:</Text>{" "}
                <Text strong>{latestSurvey.score}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Percentage:</Text>{" "}
                <Text strong>{latestSurvey.percentage}%</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Zone:</Text>{" "}
                <Tag color={getZoneColor(latestSurvey.zone)}>
                  {latestSurvey.zone}
                </Tag>
              </Col>
            </Row>
          </div>
        )}

        {initialAssessment && (
          <div style={{ marginTop: 16 }}>
            <Divider orientation="left" orientationMargin="0">
              Initial Assessment Scores
            </Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Anxiety"
                  value={initialAssessment.anxietyScore}
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Depression"
                  value={initialAssessment.depressionScore}
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Stress"
                  value={initialAssessment.stressScore}
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Total"
                  value={initialAssessment.totalScore}
                  precision={1}
                />
              </Col>
            </Row>
          </div>
        )}
      </Card>
    );
  };

  const renderRecentActivity = () => {
    // Calculate weekly goal completion percentages
    const getWeeklyGoalStats = () => {
      if (!studentProfile.goals?.length) return [];

      // Group goals by week and year, but also by creation date for invalid week numbers
      const weeklyGoals = {};
      studentProfile.goals.forEach((goal) => {
        let weekNumber = goal.weekNumber;
        let year = goal.year;

        // Check if week number is invalid (likely from seed data)
        if (weekNumber > 53 || weekNumber < 1) {
          // Use creation date to calculate proper week number
          const createdDate = new Date(goal.createdAt);
          weekNumber = getISOWeekNumber(createdDate);
          year = createdDate.getFullYear();
        }

        const weekKey = `${year}-W${weekNumber}`;
        if (!weeklyGoals[weekKey]) {
          weeklyGoals[weekKey] = {
            weekNumber: weekNumber,
            year: year,
            total: 0,
            completed: 0,
          };
        }
        weeklyGoals[weekKey].total++;
        if (goal.isCompleted) {
          weeklyGoals[weekKey].completed++;
        }
      });

      // Convert to array and calculate percentages
      return Object.values(weeklyGoals)
        .map((week) => ({
          ...week,
          percentage: Math.round((week.completed / week.total) * 100),
        }))
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.weekNumber - a.weekNumber;
        })
        .slice(0, 5); // Show last 5 weeks
    };

    // Helper function to calculate ISO week number from date
    const getISOWeekNumber = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
      const week1 = new Date(d.getFullYear(), 0, 4);
      return (
        1 +
        Math.round(
          ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
        )
      );
    };

    const recentMoods = studentProfile.moodEntries?.slice(0, 5) || [];
    const weeklyGoalStats = getWeeklyGoalStats();

    return (
      <Row gutter={16}>
        {weeklyGoalStats.length > 0 && (
          <Col span={12}>
            <Card title="Weekly Goal Completion" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={weeklyGoalStats}
                renderItem={(weekStat) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>
                            Week {weekStat.weekNumber}, {weekStat.year}
                          </Text>
                          <Tag
                            color={
                              weekStat.percentage >= 80
                                ? "green"
                                : weekStat.percentage >= 60
                                ? "orange"
                                : "red"
                            }
                          >
                            {weekStat.percentage}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <Text type="secondary">
                            {weekStat.completed} of {weekStat.total} goals
                            completed
                          </Text>
                          <Progress
                            percent={weekStat.percentage}
                            size="small"
                            showInfo={false}
                            style={{ width: 100 }}
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        {recentMoods.length > 0 && (
          <Col span={12}>
            <Card title="Recent Mood Entries" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={recentMoods}
                renderItem={(mood) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={getMoodColor(mood.moodLevel)}>
                            Mood: {mood.moodLevel}/5
                          </Tag>
                          <Text type="secondary">
                            {moment(mood.createdAt).format("MMM DD, HH:mm")}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}
      </Row>
    );
  };

  const renderInterventions = () => {
    if (!studentProfile.interventions?.length) {
      return (
        <Card title="Interventions" style={{ marginBottom: 16 }}>
          <Empty description="No interventions recorded" />
        </Card>
      );
    }

    return (
      <Card title="Interventions" style={{ marginBottom: 16 }}>
        <List
          dataSource={studentProfile.interventions}
          renderItem={(intervention) => (
            <List.Item>
              <List.Item.Meta
                avatar={<AlertOutlined />}
                title={
                  <Space>
                    <Text strong>{intervention.title}</Text>
                    <Tag
                      color={
                        intervention.status === "COMPLETED"
                          ? "green"
                          : intervention.status === "IN_PROGRESS"
                          ? "blue"
                          : "default"
                      }
                    >
                      {intervention.status}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text>{intervention.description}</Text>
                    <Text type="secondary">
                      By: {intervention.counselor.user.firstName}{" "}
                      {intervention.counselor.user.lastName} •{" "}
                      {moment(intervention.createdAt).format("MMM DD, YYYY")}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  const renderJournalActivity = () => {
    if (!studentProfile.journals?.length) {
      return null;
    }

    return (
      <Card title="Journal Activity" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Total Entries"
              value={studentProfile.journals.length}
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Private Entries"
              value={studentProfile.journals.filter((j) => j.isPrivate).length}
              prefix={<BookOutlined />}
            />
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            Recent journal activity shows student engagement in self-reflection
            and mental health awareness.
          </Text>
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          Student Profile: {studentProfile.user.firstName}{" "}
          {studentProfile.user.lastName}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
    >
      {renderBasicInfo()}
      {renderEmergencyContacts()}
      {renderStudentAnalytics()}
      {renderInterventions()}
      {renderJournalActivity()}
      {renderRecentActivity()}
    </Modal>
  );
};

export default StudentProfileView;
