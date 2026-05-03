import React, { useState } from 'react'
import { Modal, Checkbox, Button, Typography, Space, Divider } from 'antd'
import { WarningOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function DisclaimerModal({ visible, onAccept, onReject }) {
  const [agreed, setAgreed] = useState(false)

  return (
    <Modal
      open={visible}
      title={
        <Space>
          <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />
          <span style={{ fontSize: '18px', fontWeight: '600' }}>用户协议与免责声明</span>
        </Space>
      }
      closable={false}
      maskClosable={false}
      width={700}
      footer={[
        <Button key="reject" onClick={onReject}>
          不同意并退出
        </Button>,
        <Button
          key="accept"
          type="primary"
          disabled={!agreed}
          onClick={onAccept}
        >
          同意并继续使用
        </Button>
      ]}
    >
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '16px 8px'
      }}>
        <Paragraph style={{ fontSize: '14px', lineHeight: '1.8' }}>
          欢迎使用 <Text strong>AI文件整理</Text>！在开始使用前，请您仔细阅读以下条款：
        </Paragraph>

        <Divider orientation="left" style={{ fontSize: '15px', fontWeight: '600' }}>
          一、开发者权益声明
        </Divider>
        <Paragraph style={{ fontSize: '13px', lineHeight: '1.8' }}>
          本软件 <Text strong>AI文件整理</Text> 及其所有相关代码、界面设计、文档等知识产权，
          均归开发者 <Text strong>李佳和</Text> 所有，受《中华人民共和国著作权法》及国际版权条约保护。
          我们授予您非排他性、不可转让的有限许可，仅供您个人在合法范围内使用本软件。
        </Paragraph>

        <Divider orientation="left" style={{ fontSize: '15px', fontWeight: '600' }}>
          二、本地功能免责声明
        </Divider>
        <Paragraph style={{ fontSize: '13px', lineHeight: '1.8' }}>
          本软件在未接入AI功能的离线状态下，所有数据处理和文件整理行为均在您的本地设备完成。
          您在使用本地功能时自主操作的一切内容，以及因此产生的任何风险
          （如文件丢失、误删除、数据损坏等），<Text strong>均由您自行承担</Text>。
          开发者不对您的本地数据和操作结果承担任何责任。
        </Paragraph>

        <Divider orientation="left" style={{ fontSize: '15px', fontWeight: '600' }}>
          <Text style={{ color: '#ff4d4f' }}>三、AI功能风险告知（重要）</Text>
        </Divider>
        <Paragraph style={{
          fontSize: '13px',
          lineHeight: '1.8',
          background: '#fff7e6',
          padding: '12px',
          borderLeft: '4px solid #faad14',
          borderRadius: '4px'
        }}>
          <Text strong style={{ color: '#d46b08' }}>⚠️ 当您启用AI联网功能时：</Text>
          <br />
          AI生成内容来自第三方服务（包括但不限于DeepSeek、OpenAI等模型）。
          开发者无法控制、也不对AI生成内容的
          <Text strong style={{ color: '#cf1322' }}>准确性、完整性、合法性及合规性</Text>
          作任何明示或默示的担保。
          <br /><br />
          您应自行甄别AI生成的信息，自行承担因使用该内容引发的所有风险与法律后果。
          AI可能产生错误、偏见或不当内容，请谨慎使用。
        </Paragraph>

        <Divider orientation="left" style={{ fontSize: '15px', fontWeight: '600' }}>
          四、开源许可协议
        </Divider>
        <Paragraph style={{ fontSize: '13px', lineHeight: '1.8' }}>
          本软件使用了以下优秀开源项目：Electron、React、Ant Design等，
          相应的许可证类型包括MIT、Apache 2.0等。
          使用本软件即表示您同意遵守上述开源许可证的条款。
        </Paragraph>

        <Divider orientation="left" style={{ fontSize: '15px', fontWeight: '600' }}>
          <Text style={{ color: '#cf1322' }}>五、免责与责任限制（必读）</Text>
        </Divider>
        <Paragraph style={{
          fontSize: '13px',
          lineHeight: '1.8',
          background: '#fff1f0',
          padding: '12px',
          borderLeft: '4px solid #ff4d4f',
          borderRadius: '4px'
        }}>
          <Text strong style={{ color: '#cf1322', fontSize: '14px' }}>
            本软件按"现状"提供，开发者不提供任何形式的明示或默示担保。
          </Text>
          <br /><br />
          在任何情况下，开发者均不对因使用本软件导致的任何直接或间接损失
          （包括但不限于数据丢失、文件损坏、业务中断、利润损失等）承担责任，
          即使已被告知此类损害的可能性。
          <br /><br />
          <Text strong style={{ color: '#cf1322' }}>
            在法律允许的最大限度内，开发者的累计赔偿总额，
            不超过您为使用本软件实际支付的费用（本软件为免费软件，则不超过人民币壹元整）。
          </Text>
        </Paragraph>

        <Divider style={{ margin: '24px 0' }} />

        <Paragraph style={{ fontSize: '13px', lineHeight: '1.8', color: '#666' }}>
          如您对本软件有任何改进建议或疑问，欢迎通过开发者邮箱联系：
          <Text strong copyable>wswwciljk@gmail.com</Text>
        </Paragraph>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <Checkbox
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ fontSize: '14px' }}
          >
            <Text strong style={{ color: '#262626' }}>
              我已认真阅读并完全理解上述所有条款，自愿同意并接受以上全部内容
            </Text>
          </Checkbox>
        </div>
      </div>
    </Modal>
  )
}

