import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Spin,
  Alert,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Divider,
  List,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CopyOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  EyeOutlined,
  MedicineBoxOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SectionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [allCounselors, setAllCounselors] = useState([]);
  const [error, setError] = useState(null);
  const [form] = Form.useForm();

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchSections();
    fetchAvailableTeachers();
    fetchAllCounselors();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/sections", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (response.data && response.data.sections) {
        setSections(response.data.sections);
      }
    } catch (err) {
      console.error("Error fetching sections:", err);
      setError("Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeachers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/sections/available-teachers",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data && response.data.teachers) {
        setAvailableTeachers(response.data.teachers);
      }
    } catch (err) {
      console.error("Error fetching available teachers:", err);
    }
  };

  const fetchAllCounselors = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/sections/available-counselors",
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (response.data && response.data.counselors) {
        setAllCounselors(response.data.counselors);
      }
    } catch (err) {
      console.error("Error fetching counselors:", err);
    }
  };

  const handleCreateSection = () => {
    setIsEditMode(false);
    setCurrentSection(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSection = (record) => {
    setIsEditMode(true);
    setCurrentSection(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      gradeLevel: record.gradeLevel,
      isActive: record.isActive,
    });
    setIsModalVisible(true);
  };

  const handleViewSection = async (record) => {
    setDetailLoading(true);
    setIsDetailModalVisible(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/sections/${record.id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSelectedSection(response.data.section);
    } catch (err) {
      console.error("Error fetching section details:", err);
      message.error("Failed to fetch section details");
      setIsDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try {
      await axios.delete(`http://localhost:3000/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      message.success("Section deleted successfully");
      fetchSections();
    } catch (err) {
      console.error("Error deleting section:", err);
      message.error("Failed to delete section");
    }
  };

  const handleRegenerateCode = async (sectionId) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/sections/${sectionId}/regenerate-code`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      message.success(`New code: ${response.data.section.code}`);
      fetchSections();
    } catch (err) {
      console.error("Error regenerating code:", err);
      message.error("Failed to regenerate code");
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    message.success("Code copied to clipboard!");
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then(async (values) => {
        try {
          if (isEditMode && currentSection) {
            await axios.put(
              `http://localhost:3000/api/sections/${currentSection.id}`,
              values,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            message.success("Section updated successfully");
          } else {
            await axios.post("http://localhost:3000/api/sections", values, {
              headers: {
                Authorization: `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
            });
            message.success("Section created successfully");
          }
          fetchSections();
          setIsModalVisible(false);
          form.resetFields();
        } catch (err) {
          console.error("Error saving section:", err);
          message.error(
            err.response?.data?.message || "Failed to save section"
          );
        }
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleAssignTeacher = async (sectionId, teacherId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/sections/${sectionId}/assign-teacher`,
        { teacherId },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success("Teacher assigned successfully");
      fetchSections();
      fetchAvailableTeachers();
      // Refresh detail modal if open
      if (selectedSection?.id === sectionId) {
        handleViewSection({ id: sectionId });
      }
    } catch (err) {
      console.error("Error assigning teacher:", err);
      message.error(err.response?.data?.message || "Failed to assign teacher");
    }
  };

  const handleRemoveTeacher = async (sectionId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/sections/${sectionId}/remove-teacher`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      message.success("Teacher removed successfully");
      fetchSections();
      fetchAvailableTeachers();
      if (selectedSection?.id === sectionId) {
        handleViewSection({ id: sectionId });
      }
    } catch (err) {
      console.error("Error removing teacher:", err);
      message.error("Failed to remove teacher");
    }
  };

  const handleAssignCounselor = async (sectionId, counselorId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/sections/${sectionId}/assign-counselor`,
        { counselorId },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success("Counselor assigned successfully");
      fetchSections();
      fetchAllCounselors();
      if (selectedSection?.id === sectionId) {
        handleViewSection({ id: sectionId });
      }
    } catch (err) {
      console.error("Error assigning counselor:", err);
      message.error(
        err.response?.data?.message || "Failed to assign counselor"
      );
    }
  };

  const handleRemoveCounselor = async (sectionId, counselorId) => {
    try {
      await axios.post(
        `http://localhost:3000/api/sections/${sectionId}/remove-counselor`,
        { counselorId },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success("Counselor removed successfully");
      fetchSections();
      fetchAllCounselors();
      if (selectedSection?.id === sectionId) {
        handleViewSection({ id: sectionId });
      }
    } catch (err) {
      console.error("Error removing counselor:", err);
      message.error("Failed to remove counselor");
    }
  };

  // Get counselors not already assigned to this section
  const getAvailableCounselorsForSection = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    const assignedIds = (section?.counselors || []).map((c) => c.id);
    return allCounselors.filter((c) => !assignedIds.includes(c.id));
  };

  const columns = [
    {
      title: "Section",
      key: "section",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          {record.gradeLevel && (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.gradeLevel}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <Space>
          <Tag
            color="blue"
            style={{ fontFamily: "monospace", fontSize: "14px" }}
          >
            {code}
          </Tag>
          <Tooltip title="Copy code">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyCode(code)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Teacher",
      key: "teacher",
      render: (_, record) =>
        record.teacher ? (
          <Space>
            <UserOutlined />
            <Text>
              {record.teacher.firstName} {record.teacher.lastName}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Not assigned</Text>
        ),
    },
    {
      title: "Counselor",
      key: "counselor",
      render: (_, record) =>
        record.counselors?.length > 0 ? (
          <Space direction="vertical" size={0}>
            {record.counselors.map((c) => (
              <Tag key={c.id} color="orange" style={{ marginBottom: 2 }}>
                <MedicineBoxOutlined /> {c.firstName} {c.lastName}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">Not assigned</Text>
        ),
    },
    {
      title: "Students",
      dataIndex: "studentCount",
      key: "studentCount",
      render: (count) => (
        <Badge
          count={count}
          showZero
          style={{ backgroundColor: count > 0 ? "#52c41a" : "#d9d9d9" }}
        >
          <TeamOutlined style={{ fontSize: "18px", marginRight: "8px" }} />
        </Badge>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewSection(record)}
            />
          </Tooltip>
          <Tooltip title="Regenerate Code">
            <Popconfirm
              title="This will generate a new code. Students/teachers will need the new code to join."
              onConfirm={() => handleRegenerateCode(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" icon={<ReloadOutlined />} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditSection(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this section?"
              description="All students will be unassigned from this section."
              onConfirm={() => handleDeleteSection(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "20px" }}>Loading sections...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <Title level={2}>Section Management</Title>
          <Text type="secondary">
            Manage class sections, codes, and assignments
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateSection}
        >
          New Section
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sections"
              value={sections.length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Sections"
              value={sections.filter((s) => s.isActive).length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={sections.reduce((sum, s) => sum + s.studentCount, 0)}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sections with Counselors"
              value={sections.filter((s) => s.counselors?.length > 0).length}
              suffix={`/ ${sections.length}`}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={sections}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={isEditMode ? "Edit Section" : "Create New Section"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" name="sectionForm">
          <Form.Item
            name="name"
            label="Section Name"
            rules={[{ required: true, message: "Please enter section name" }]}
          >
            <Input placeholder="e.g., Grade 10 - Section A" />
          </Form.Item>

          <Form.Item name="gradeLevel" label="Grade Level">
            <Select placeholder="Select grade level" allowClear>
              <Option value="Grade 7">Grade 7</Option>
              <Option value="Grade 8">Grade 8</Option>
              <Option value="Grade 9">Grade 9</Option>
              <Option value="Grade 10">Grade 10</Option>
              <Option value="Grade 11">Grade 11</Option>
              <Option value="Grade 12">Grade 12</Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter section description" />
          </Form.Item>

          {isEditMode && (
            <Form.Item name="isActive" label="Status">
              <Select>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Section Detail Modal */}
      <Modal
        title={
          selectedSection
            ? `Section Details: ${selectedSection.name}`
            : "Section Details"
        }
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedSection(null);
        }}
        footer={null}
        width={900}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : selectedSection ? (
          <div>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Section Information">
                  <p>
                    <strong>Name:</strong> {selectedSection.name}
                  </p>
                  <p>
                    <strong>Code:</strong>{" "}
                    <Tag color="blue">{selectedSection.code}</Tag>
                  </p>
                  <p>
                    <strong>Grade Level:</strong>{" "}
                    {selectedSection.gradeLevel || "Not specified"}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {selectedSection.description || "No description"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Tag
                      color={selectedSection.isActive ? "success" : "default"}
                    >
                      {selectedSection.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Teacher Assignment">
                  {selectedSection.teacher ? (
                    <div>
                      <p>
                        <UserOutlined />{" "}
                        {selectedSection.teacher.user.firstName}{" "}
                        {selectedSection.teacher.user.lastName}
                      </p>
                      <p>
                        <Text type="secondary">
                          {selectedSection.teacher.user.email}
                        </Text>
                      </p>
                      <Popconfirm
                        title="Remove teacher from this section?"
                        onConfirm={() =>
                          handleRemoveTeacher(selectedSection.id)
                        }
                      >
                        <Button danger size="small">
                          Remove Teacher
                        </Button>
                      </Popconfirm>
                    </div>
                  ) : (
                    <div>
                      <Text type="secondary">No teacher assigned</Text>
                      {availableTeachers.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <Select
                            placeholder="Select a teacher"
                            style={{ width: "100%" }}
                            onChange={(teacherId) =>
                              handleAssignTeacher(
                                selectedSection.id,
                                teacherId
                              )
                            }
                          >
                            {availableTeachers.map((t) => (
                              <Option key={t.id} value={t.id}>
                                {t.firstName} {t.lastName}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  title={`Counselor Assignment (${selectedSection.counselors?.length || 0})`}
                >
                  {selectedSection.counselors?.length > 0 ? (
                    <List
                      size="small"
                      dataSource={selectedSection.counselors}
                      renderItem={(counselor) => (
                        <List.Item
                          actions={[
                            <Popconfirm
                              key="remove"
                              title="Remove this counselor from the section?"
                              onConfirm={() =>
                                handleRemoveCounselor(
                                  selectedSection.id,
                                  counselor.id
                                )
                              }
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<CloseCircleOutlined />}
                              />
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size="small"
                                icon={<MedicineBoxOutlined />}
                                style={{ backgroundColor: "#fa8c16" }}
                              />
                            }
                            title={`${counselor.user.firstName} ${counselor.user.lastName}`}
                            description={counselor.user.email}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">No counselor assigned</Text>
                  )}

                  {/* Add counselor dropdown */}
                  {(() => {
                    const available = getAvailableCounselorsForSection(
                      selectedSection.id
                    );
                    if (available.length === 0) return null;
                    return (
                      <div style={{ marginTop: "10px" }}>
                        <Select
                          placeholder="Assign a counselor"
                          style={{ width: "100%" }}
                          onChange={(counselorId) =>
                            handleAssignCounselor(
                              selectedSection.id,
                              counselorId
                            )
                          }
                          value={undefined}
                        >
                          {available.map((c) => (
                            <Option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName}
                              {c.sectionCount > 0
                                ? ` (${c.sectionCount} section${c.sectionCount > 1 ? "s" : ""})`
                                : ""}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    );
                  })()}
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card
              size="small"
              title={`Students (${selectedSection.students?.length || 0})`}
            >
              {selectedSection.students?.length > 0 ? (
                <Table
                  dataSource={selectedSection.students}
                  columns={[
                    {
                      title: "Name",
                      key: "name",
                      render: (_, student) => (
                        <span>
                          {student.user.firstName} {student.user.lastName}
                        </span>
                      ),
                    },
                    {
                      title: "Email",
                      dataIndex: ["user", "email"],
                      key: "email",
                    },
                    {
                      title: "Gender",
                      dataIndex: ["user", "gender"],
                      key: "gender",
                      render: (gender) => gender || "-",
                    },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ) : (
                <Text type="secondary">No students in this section</Text>
              )}
            </Card>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default SectionManagement;
