import { useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../constants/colors';
import { Typography } from './Typography';
export const DatePicker = ({ label, options, disabled = false, dropDownStyle, style, val, onValueChange, multiple = false }) => {
  const [items, setItems] = useState(val ? val : []);
  const dpRef = useRef(null);

  // useEffect(() => {
  //   setItems(val ? val : [])
  // }, [val])

  return (
    <View style={{ flex: 1, backgroundColor: "#eee", padding: 10, borderRadius: 5, ...style }}>
      <SectionedMultiSelect
        ref={dpRef}
        IconRenderer={Icon}
        items={options}
        uniqueKey="value"
        displayKey='label'
        subKey="children"
        selectText={label}
        showDropDowns={true}
        onSelectedItemsChange={(selectedItems) => {
          setItems(selectedItems)
          if (onValueChange)
            onValueChange(selectedItems);
        }}
        selectedItems={items}
        modalWithSafeAreaView
        searchPlaceholderText='Search...'
        confirmText='Save'
        showRemoveAll
        modalWithTouchable
        headerComponent={<View style={{ padding: 15, flexDirection: "row", justifyContent: "space-between" }}>
          <Typography size={16} textType='bold' children={"Select " + label} />
          <TouchableOpacity onPress={() => { dpRef.current._toggleSelector() }}>
            <Icon name='close' size={20} color='#aaa' />
          </TouchableOpacity>
        </View>}
        hideSearch
        showChips={false}
        single={!multiple}
        hideConfirm={!multiple}
        styles={{
          item: {
            padding: 10,
            paddingVertical: 10
          },
          itemText: {
            fontWeight: "normal"
          },
          button: {
            backgroundColor: colors.secondary
          },
          selectedItem: {
            backgroundColor: "#eee",
          },
          selectToggle: {
            margin: 0,
          },
          selectToggleText: {
            fontSize: 14
          },
        }}
      />
    </View>
  );
};
