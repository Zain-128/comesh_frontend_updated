import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { heightPercentageToDP, widthPercentageToDP } from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { Typography } from "../../../components/Typography";
import { AppContainer } from "../../../components/layouts/AppContainer";
import colors from "../../../constants/colors";
import { IMAGES } from "../../../constants/images";
import endPoints from "../../../constants/endPoints";
import apiRequest from "../../../utils/apiRequest";
import helper from "../../../utils/helper";

const PAGE_SIZE = 20;

function UserSearchRow({ item, onPress }) {
  const [imgFail, setImgFail] = useState(false);
  const name = [item.firstName, item.lastName].filter(Boolean).join(" ").trim() || "User";
  const thumbSrc = helper.getMediaSource(item.profileVideoThumbnail || item.profileImage || item.profileVideo);
  const showUri = thumbSrc && !imgFail;

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} activeOpacity={0.85} onPress={onPress}>
        <Image
          source={showUri ? thumbSrc : IMAGES.men}
          style={styles.avatar}
          onError={() => setImgFail(true)}
        />
        <View style={styles.rowText}>
          <Typography textType="semiBold" size={16} children={name} />
          {item.email ? (
            <Typography textType="light" size={12} color="#999" children={item.email} />
          ) : null}
          {item.niche ? (
            <Typography textType="light" size={11} color={colors.primary} children={item.niche} />
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="right" size={18} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
}

const SearchUsers = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (pageNum, search, append) => {
    try {
      const q = encodeURIComponent(search.trim());
      const { data: body } = await apiRequest.get(
        `${endPoints.SearchUsersList}?page=${pageNum}&limit=${PAGE_SIZE}&search=${q}`
      );
      if (!body?.success) {
        Toast.show({ type: "error", text1: "Error", text2: body?.message || "Could not load users" });
        return;
      }
      const payload = body.data || {};
      const rows = payload.data || [];
      const t = Number(payload.total) || 0;
      setTotal(t);
      setPage(pageNum);
      if (append) {
        setList((prev) => {
          const ids = new Set(prev.map((u) => u._id));
          const merged = [...prev];
          rows.forEach((u) => {
            if (u?._id && !ids.has(u._id)) merged.push(u);
          });
          return merged;
        });
      } else {
        setList(rows);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: e?.message || "Network error" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchPage(1, query, false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchPage]);

  const onEndReached = () => {
    if (loading || loadingMore) return;
    if (list.length >= total) return;
    setLoadingMore(true);
    fetchPage(page + 1, query, true);
  };

  const renderItem = ({ item }) => (
    <UserSearchRow
      item={item}
      onPress={() => navigation.navigate("UserProfile", { userID: item._id })}
    />
  );

  return (
    <AppContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Icon name="arrowleft" size={22} color="#111" />
        </TouchableOpacity>
        <Typography textType="bold" size={20} children="Find people" />
        <View style={{ width: 22 }} />
      </View>
      <View style={styles.searchWrap}>
        <Icon name="search1" size={18} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Search by name or email"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Icon name="close" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      {loading && !list.length ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => String(item._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.centered}>
                <Typography textType="medium" size={14} color="#999" align="center" children="No users found. Try another search." />
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </AppContainer>
  );
};

export default SearchUsers;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f2f2f7",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: heightPercentageToDP(4),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: widthPercentageToDP(14),
    height: widthPercentageToDP(14),
    borderRadius: widthPercentageToDP(7),
    marginRight: 12,
    backgroundColor: "#eee",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
