import { Tabs } from 'antd';
const onChangeTab = (key) => {
  console.log(key);
};
const tabPages = [
  {
    key: '1',
    label: `Chat Bots`,
    children: `Content of Tab Pane 1`,
  },
  {
    key: '2',
    label: `Embedding`,
    children: `Content of Tab Pane 2`,
  },
];
const Tab = () => <Tabs defaultActiveKey="1" items={tabPages} onChange={onChangeTab} />;
export default Tab;