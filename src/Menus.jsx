import React from 'react';
import arrayTreeFilter from 'array-tree-filter';
import { findDOMNode } from 'react-dom';

class Menus extends React.Component {
  componentDidMount() {
    this.scrollActiveItemToView();
  }

  componentWillReceiveProps() {
    if (!this.activeOptions) {
      return;
    }
    const targetOption = this.activeOptions[this.activeOptions.length - 1];
    // 如果这时候返回结果，这个节点没有children，那么这个设置为叶子节点
    if (targetOption.children && targetOption.children.length === 0 && this.props.noData === null) {
      if (this.props.popupVisible) {
        this.props.setPopupVisible(false);
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.scrollActiveItemToView();
    }
  }

  onSelect(targetOption, menuIndex) {
    if (!targetOption || targetOption.disabled) {
      return;
    }
    let activeValue = this.props.activeValue;
    activeValue = activeValue.slice(0, menuIndex + 1);
    activeValue[menuIndex] = targetOption.value;
    const activeOptions = this.getActiveOptions(activeValue);
    if (targetOption.isLeaf === false && !targetOption.children && this.props.loadData) {
      if (this.props.changeOnSelect || this.props.noData === null) {
        this.props.onChange(activeOptions, { visible: true });
      }
      this.props.onSelect({ activeValue });
      // 获取当前选中的activeOptions引用
      this.activeOptions = activeOptions;
      this.props.loadData(activeOptions);
      return;
    }
    const onSelectArgument = {};
    if (!targetOption.children || !targetOption.children.length) {
      this.props.onChange(activeOptions, { visible: false });
      // set value to activeValue when select leaf option
      onSelectArgument.value = activeValue;
    } else if (this.props.changeOnSelect) {
      this.props.onChange(activeOptions, { visible: true });
      // set value to activeValue on every select
      onSelectArgument.value = activeValue;
    }
    onSelectArgument.activeValue = activeValue;
    this.props.onSelect(onSelectArgument);
  }

  getOption(option, menuIndex) {
    const { prefixCls, expandTrigger } = this.props;
    const onSelect = this.onSelect.bind(this, option, menuIndex);
    let expandProps = {
      onClick: onSelect,
    };
    let menuItemCls = `${prefixCls}-menu-item`;
    const hasChildren = option.children && option.children.length > 0;
    if (hasChildren || option.isLeaf === false) {
      menuItemCls += ` ${prefixCls}-menu-item-expand`;
    }
    if (expandTrigger === 'hover' && hasChildren) {
      expandProps = {
        onMouseEnter: this.delayOnSelect.bind(this, onSelect),
        onMouseLeave: this.delayOnSelect.bind(this),
      };
    }
    if (this.isActiveOption(option, menuIndex)) {
      menuItemCls += ` ${prefixCls}-menu-item-active`;
      expandProps.ref = `activeItem${menuIndex}`;
    }
    if (option.disabled) {
      menuItemCls += ` ${prefixCls}-menu-item-disabled`;
    }
    if (option.loading) {
      menuItemCls += ` ${prefixCls}-menu-item-loading`;
    }
    let title = '';
    if (option.title) {
      title = option.title;
    } else if (typeof option.label === 'string') {
      title = option.label;
    }
    return (
      <li
        key={option.value}
        className={menuItemCls}
        title={title}
        {...expandProps}
      >
        {option.label}
      </li>
    );
  }

  getActiveOptions(values) {
    const activeValue = values || this.props.activeValue;
    const options = this.props.options;
    return arrayTreeFilter(options, (o, level) => o.value === activeValue[level]);
  }

  getShowOptions() {
    const { options } = this.props;
    const result = this.getActiveOptions()
      .map(activeOption => activeOption.children)
      .filter(activeOption => !!activeOption);
    result.unshift(options);
    return result;
  }

  delayOnSelect(onSelect) {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
    if (typeof onSelect === 'function') {
      this.delayTimer = setTimeout(() => {
        onSelect();
        this.delayTimer = null;
      }, 150);
    }
  }

  scrollActiveItemToView() {
    // scroll into view
    const optionsLength = this.getShowOptions().length;
    for (let i = 0; i < optionsLength; i++) {
      const itemComponent = this.refs[`activeItem${i}`];
      if (itemComponent) {
        const target = findDOMNode(itemComponent);
        target.parentNode.scrollTop = target.offsetTop;
      }
    }
  }

  isActiveOption(option, menuIndex) {
    const { activeValue = [] } = this.props;
    return activeValue[menuIndex] === option.value;
  }

  render() {
    const { prefixCls, dropdownMenuColumnStyle, noData } = this.props;

    const getLiItem = (options, menuIndex) => {
      if (Array.isArray(options) && options.length === 0) {
        return (
          <li
            className={`${prefixCls}-menu-no-data`}
          >
            {noData === undefined ? '' : noData}
          </li>
        );
      }
      return options.map(option => this.getOption(option, menuIndex));
    };
    return (
      <div>
        {this.getShowOptions().map((options, menuIndex) => {
          // noData === null 并且 children为空数组的时候，不显示叶节点数据
          return noData === null && Array.isArray(options) && options.length === 0
            ? null
            : (
              <ul className={`${prefixCls}-menu`} key={menuIndex} style={dropdownMenuColumnStyle}>
                {getLiItem(options, menuIndex)}
              </ul>
            );
        })}
      </div>
    );
  }
}

Menus.defaultProps = {
  options: [],
  value: [],
  activeValue: [],
  onChange() {
  },
  onSelect() {
  },
  prefixCls: 'rc-cascader-menus',
  visible: false,
  expandTrigger: 'click',
  changeOnSelect: false,
};

Menus.propTypes = {
  value: React.PropTypes.array,
  activeValue: React.PropTypes.array,
  options: React.PropTypes.array.isRequired,
  prefixCls: React.PropTypes.string,
  expandTrigger: React.PropTypes.string,
  onChange: React.PropTypes.func,
  onSelect: React.PropTypes.func,
  loadData: React.PropTypes.func,
  visible: React.PropTypes.bool,
  changeOnSelect: React.PropTypes.bool,
  dropdownMenuColumnStyle: React.PropTypes.object,
  noData: React.PropTypes.string,
  popupVisible: React.PropTypes.bool,
  setPopupVisible: React.PropTypes.func,
};

export default Menus;
